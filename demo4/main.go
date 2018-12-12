package main

import (
	"fmt"
	"k8s.io/client-go/kubernetes"
	"github.com/owenliang/k8s-client-go/common"
	"io/ioutil"
	apps_v1beta1 "k8s.io/api/apps/v1beta1"
	"encoding/json"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	"time"
	"strconv"
	core_v1 "k8s.io/api/core/v1"
)

func main() {
	var (
		clientset *kubernetes.Clientset
		deployYaml []byte
		deployJson []byte
		deployment  = apps_v1beta1.Deployment{}
		k8sDeployment *apps_v1beta1.Deployment
		podList *core_v1.PodList
		pod core_v1.Pod
		err error
	)

	// 初始化k8s客户端
	if clientset, err = common.InitClient(); err != nil {
		goto FAIL
	}

	// 读取YAML
	if deployYaml, err = ioutil.ReadFile("./nginx.yaml"); err != nil {
		goto FAIL
	}

	// YAML转JSON
	if deployJson, err = yaml2.ToJSON(deployYaml); err != nil {
		goto FAIL
	}

	// JSON转struct
	if err = json.Unmarshal(deployJson, &deployment); err != nil {
		goto FAIL
	}

	// 给Pod添加label
	deployment.Spec.Template.Labels["deploy_time"] = strconv.Itoa(int(time.Now().Unix()))

 	// 更新deployments
	if _, err = clientset.AppsV1beta1().Deployments("default").Update(&deployment); err != nil {
		goto FAIL
	}

	// 等待更新完成
	for {
		// 获取k8s中deployment的状态
		if k8sDeployment, err = clientset.AppsV1beta1().Deployments("default").Get(deployment.Name, v1.GetOptions{}); err != nil {
			goto RETRY
		}

		// 进行状态判定
		if k8sDeployment.Status.UpdatedReplicas == *(k8sDeployment.Spec.Replicas) &&
			k8sDeployment.Status.Replicas == *(k8sDeployment.Spec.Replicas) &&
			k8sDeployment.Status.AvailableReplicas == *(k8sDeployment.Spec.Replicas) &&
			k8sDeployment.Status.ObservedGeneration == k8sDeployment.Generation {
				// 滚动升级完成
				break
		}

		// 打印工作中的pod比例
		fmt.Printf("部署中：(%d/%d)\n", k8sDeployment.Status.AvailableReplicas, *(k8sDeployment.Spec.Replicas))

		RETRY:
		time.Sleep(1 * time.Second)
	}

	fmt.Println("部署成功!")

	// 打印每个pod的状态(可能会打印出terminating中的pod, 但最终只会展示新pod列表)
	if podList, err = clientset.CoreV1().Pods("default").List(v1.ListOptions{LabelSelector: "app=nginx", IncludeUninitialized: false}); err == nil {
		for _, pod = range podList.Items {
			podName := pod.Name
			podStatus := string(pod.Status.Phase)

			// PodRunning means the pod has been bound to a node and all of the containers have been started.
			// At least one container is still running or is in the process of being restarted.
			if podStatus == string(core_v1.PodRunning) {
				// 汇总错误原因不为空
				if pod.Status.Reason != "" {
					podStatus = pod.Status.Reason
					goto KO
				}

				// condition有错误信息
				for _, cond := range pod.Status.Conditions {
					if cond.Type == core_v1.PodReady {	// POD就绪状态
						if cond.Status != core_v1.ConditionTrue {	// 失败
							podStatus = cond.Reason
						}
						goto KO
					}
				}

				// 没有ready condition, 状态未知
				podStatus = "Unknown"
			}

			KO:
			fmt.Printf("[name:%s status:%s]\n", podName, podStatus)
		}
	}

	return

FAIL:
	fmt.Println(err)
	return
}
