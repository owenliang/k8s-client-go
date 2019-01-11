package main

import (
	"github.com/owenliang/k8s-client-go/common"
	"k8s.io/client-go/rest"
	"fmt"
	"github.com/owenliang/k8s-client-go/demo10/pkg/client/clientset/versioned"
	"github.com/owenliang/k8s-client-go/demo10/pkg/client/informers/externalversions"
	"time"
	"github.com/owenliang/k8s-client-go/demo10/pkg/client/informers/externalversions/nginx_controller/v1"
	"github.com/owenliang/k8s-client-go/demo10/controller"
)

func main() {
	var (
		restConf *rest.Config
		crdClientset *versioned.Clientset
		crdInformerFactory externalversions.SharedInformerFactory
		nginxInformer v1.NginxInformer
		nginxController *controller.NginxController
		err error
	)

	// 读取admin.conf, 生成客户端基本配置
	if restConf, err = common.GetRestConf(); err != nil {
		goto FAIL
	}

	// 创建CRD的client
	if crdClientset, err = versioned.NewForConfig(restConf); err != nil {
		goto FAIL
	}

	// Informer工厂
	crdInformerFactory = externalversions.NewSharedInformerFactory(crdClientset, time.Second * 30)

	// 取得nginx informer
	nginxInformer = crdInformerFactory.Mycompany().V1().Nginxes()

	// 创建调度controller
	nginxController = &controller.NginxController{CrdClientset: crdClientset, NginxInformer: nginxInformer}
	nginxController.Start()

	// 等待
	for {
		time.Sleep(1 * time.Second)
	}

	return

FAIL:
	fmt.Println(err)
	return
}
