package controller

import (
	"github.com/owenliang/k8s-client-go/demo10/pkg/client/clientset/versioned"
	"github.com/owenliang/k8s-client-go/demo10/pkg/client/informers/externalversions/nginx_controller/v1"
	"k8s.io/client-go/tools/cache"
	"fmt"
	nginx_v1 "github.com/owenliang/k8s-client-go/demo10/pkg/apis/nginx_controller/v1"
	"k8s.io/client-go/util/workqueue"
)

type NginxController struct {
	CrdClientset *versioned.Clientset
	NginxInformer v1.NginxInformer
	workqueue workqueue.RateLimitingInterface
}

func (nginxController *NginxController) Start() (err error) {
	var (
		stopCh = make(chan struct{})
		i int
		syncOk bool
	)

	// 注册event handler
	nginxController.NginxInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			var (
				nginx *nginx_v1.Nginx
			)

			nginx = obj.(*nginx_v1.Nginx)
			fmt.Println("OnAddNginx", nginx)

			// 把event存到workqueue
			nginxController.enqueueNginx(obj)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			var (
				oldNginx *nginx_v1.Nginx
				newNginx *nginx_v1.Nginx
			)

			oldNginx =  oldObj.(*nginx_v1.Nginx)
			newNginx = newObj.(*nginx_v1.Nginx)
			fmt.Println("OnUpdateNginx", oldNginx, newNginx)

			// 把event存到workqueue
			nginxController.enqueueNginx(newObj)
		},
		DeleteFunc: func(obj interface{}) {
			var (
				nginx *nginx_v1.Nginx
			)

			nginx = obj.(*nginx_v1.Nginx)
			fmt.Println("OnDeleteNginx", nginx)

			// 把event存到workqueue
			nginxController.enqueueNginx(obj)
		},
	})

	// 限速+去重的event队列
	nginxController.workqueue = workqueue.NewNamedRateLimitingQueue(workqueue.DefaultControllerRateLimiter(), "Nginx")

	// nginx informer开始拉取事件，存到local cache，并回调event handler, 由event handler存入workqueue
	go nginxController.NginxInformer.Informer().Run(stopCh)

	// 等待etcd已有数据都下载回来, 再启动事件处理线程, 这样local cache可以反馈出贴近准实时的etcd数据，供逻辑决策准确
	if syncOk = cache.WaitForCacheSync(stopCh, nginxController.NginxInformer.Informer().HasSynced); !syncOk {
		err = fmt.Errorf("sync失败")
		return
	}

	// 启动process事件处理
	for i = 0; i < 2; i++ {
		go nginxController.runWorker()
	}

	return
}

// 消费workqueue
func (nginxController *NginxController) runWorker() {
	for {
		nginxController.processItem()
	}
}

// 处理event
func (nginxController *NginxController) processItem() {
	var (
		obj interface{}
		key string
		ok bool
		shutdown bool
		namespace string
		name string
		err error
		nginx *nginx_v1.Nginx
	)

	if obj, shutdown = nginxController.workqueue.Get(); shutdown {
		return
	}

	// 处理结束, 从队列删除
	defer nginxController.workqueue.Done(obj)

	// 反解namespace/name
	if key, ok = obj.(string); !ok {
		nginxController.workqueue.Forget(obj)
		return
	}
	if namespace, name, err = cache.SplitMetaNamespaceKey(key); err != nil {
		goto FAIL
	}

	// TODO: 实现核心调度逻辑
	if nginx, err = nginxController.NginxInformer.Lister().Nginxes(namespace).Get(name); err != nil {
		goto FAIL
	}

	fmt.Printf("namespace=%s name=%s uid=%s replicas=%d\n", nginx.Namespace, nginx.Name, nginx.UID, nginx.Spec.Replicas)

	// 处理成功，重置限速计数
	nginxController.workqueue.Forget(obj)
	return

FAIL:
	fmt.Println("处理失败:", err)
	// 处理失败, 重新放回队列, 累加限速计数
	nginxController.workqueue.AddRateLimited(key)
}

// 向workqueue设置变化的resource
func (nginxController *NginxController) enqueueNginx(obj interface{}) {
	var (
		key string
		err error
	)

	if key, err = cache.MetaNamespaceKeyFunc(obj); err != nil {
		return
	}

	// 把workqueue里放的是字符串的key, 会针对这个key做限速和去重
	nginxController.workqueue.AddRateLimited(key)
}