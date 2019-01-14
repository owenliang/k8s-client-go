package controller

import (
	"k8s.io/client-go/tools/cache"
	"k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/klog"
)

// 向workqueue设置变化的resource
func (nginxController *NginxController) EnqueuePod(obj interface{}) {
	var (
		key string
		err error
	)

	if key, err = cache.MetaNamespaceKeyFunc(obj); err != nil {
		return
	}

	// 把workqueue里放的是字符串的key, 会针对这个key做限速和去重
	nginxController.PodWorkqueue.AddRateLimited(key)
}

func (nginxController *NginxController)OnAddPod(obj interface{}) {
	// 把event存到workqueue
	nginxController.EnqueuePod(obj)
}

func (nginxController *NginxController) OnUpdatePod(oldObj, newObj interface{}) {
	// 把event存到workqueue
	nginxController.EnqueuePod(newObj)
}

func (nginxController *NginxController) OnDeletePod(obj interface{}) {
	// 通知nginx processor
	var (
		pod v1.Pod
		ok bool
		nginxKey string
		hasLabel bool
	)

	// 反解出Pod
	if pod, ok = obj.(v1.Pod); !ok {
		return
	}

	// 确认属于nginx部署的POD
	if nginxKey, hasLabel = pod.Labels["nginxName"]; !hasLabel {
		return 	// 不属于nginx部署的POD， 忽略
	}

	nginxController.NginxWorkqueue.AddRateLimited(nginxKey)
	klog.Infoln("[POD - 删除]", nginxKey, pod.Name)
}

// 消费workqueue
func (nginxController *NginxController) runPodWorker() {
	for {
		nginxController.processPodEvent()
	}
}

// 处理event
func (nginxController *NginxController) processPodEvent() {
	var (
		obj interface{}
		key string
		ok bool
		shutdown bool
		err error
	)

	if obj, shutdown = nginxController.PodWorkqueue.Get(); shutdown {
		return
	}

	// 处理结束, 从队列删除
	defer nginxController.PodWorkqueue.Done(obj)

	// workqueue的key
	if key, ok = obj.(string); !ok {
		nginxController.PodWorkqueue.Forget(obj)
		return
	}

	////////// 核心逻辑 ////////////
	if err = nginxController.handlePodObject(key); err != nil {
		goto FAIL
	}

	// 处理成功，重置限速计数
	nginxController.PodWorkqueue.Forget(obj)
	return

FAIL:
	klog.Errorln("[POD - 处理异常]", key, err)
	// 处理失败, 重新放回队列, 累加限速计数
	nginxController.PodWorkqueue.AddRateLimited(key)
}

func (nginxController *NginxController) handlePodObject(key string) (err error) {
	var (
		namespace string
		name string
		pod *v1.Pod
		hasLabel bool
		nginxKey string
	)
	if namespace, name, err = cache.SplitMetaNamespaceKey(key); err != nil {
		return
	}

	// 从local cache获取pod信息
	if pod, err = nginxController.PodInformer.Lister().Pods(namespace).Get(name); err != nil {
		if errors.IsNotFound(err) {
			err = nil
		}
		return
	}

	// 确认属于nginx部署的POD
	if nginxKey, hasLabel = pod.Labels["nginxKey"]; !hasLabel {
		return
	}

	// 触发nginx检测
	nginxController.NginxWorkqueue.AddRateLimited(nginxKey)
	klog.Infoln("[POD - 更新]", nginxKey, pod.Name)
	return
}