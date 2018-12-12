package main

import (
	"k8s.io/client-go/tools/clientcmd"
	"io/ioutil"
	"fmt"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/kubernetes"
	meta_v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	core_v1 "k8s.io/api/core/v1"
)

func main() {
	var (
		kubeconfig []byte
		restConf *rest.Config
		clientset *kubernetes.Clientset
		podsList *core_v1.PodList
		err error
	)

	// 读kubeconfig文件
	if kubeconfig, err = ioutil.ReadFile("./admin.conf"); err != nil {
		goto END
	}

	// 生成rest client配置
	if restConf, err = clientcmd.RESTConfigFromKubeConfig(kubeconfig); err != nil {
		goto END
	}

	// 生成clientset配置
	if clientset, err = kubernetes.NewForConfig(restConf); err != nil {
		goto END
	}

	// 获取default命名空间下的所有POD
	if podsList, err = clientset.CoreV1().Pods("default").List(meta_v1.ListOptions{}); err != nil {
		goto END
	}

	fmt.Println(*podsList)

	return

END:
	fmt.Println(err)
	return
}
