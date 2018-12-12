package main

import (
	"fmt"
	"k8s.io/client-go/kubernetes"
	"github.com/owenliang/k8s-client-go/common"
	"io/ioutil"
	apps_v1beta1 "k8s.io/api/apps/v1beta1"
	"encoding/json"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"
	meta_v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/errors"
)

func main() {
	var (
		clientset *kubernetes.Clientset
		deployYaml []byte
		deployJson []byte
		deployment  = apps_v1beta1.Deployment{}
		replicas int32
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

	// 修改replicas数量为1
	replicas = 1
	deployment.Spec.Replicas = &replicas

	// 查询k8s是否有该deployment
	if _, err = clientset.AppsV1beta1().Deployments("default").Get(deployment.Name, meta_v1.GetOptions{}); err != nil {
		if !errors.IsNotFound(err) {
			goto FAIL
		}
		// 不存在则创建
		if _, err = clientset.AppsV1beta1().Deployments("default").Create(&deployment); err != nil {
			goto FAIL
		}
	} else {	 // 已存在则更新
		if _, err = clientset.AppsV1beta1().Deployments("default").Update(&deployment); err != nil {
			goto FAIL
		}
	}

	fmt.Println("apply成功!")
	return

FAIL:
	fmt.Println(err)
	return
}
