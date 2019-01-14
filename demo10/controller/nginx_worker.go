package controller

import (
	"k8s.io/client-go/tools/cache"
	nginx_v1 "github.com/owenliang/k8s-client-go/demo10/pkg/apis/nginx_controller/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/api/core/v1"
	core_v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"strconv"
	"k8s.io/apimachinery/pkg/api/errors"
	"time"
	"k8s.io/klog"
)

// 向workqueue设置变化的resource
func (nginxController *NginxController) EnqueueNginx(obj interface{}) {
	var (
		key string
		err error
	)

	if key, err = cache.MetaNamespaceKeyFunc(obj); err != nil {
		return
	}

	// 把workqueue里放的是字符串的key, 会针对这个key做限速和去重
	nginxController.NginxWorkqueue.AddRateLimited(key)
}

func (nginxController *NginxController)OnAddNginx(obj interface{}) {
	// 把event存到workqueue
	nginxController.EnqueueNginx(obj)
}

func (nginxController *NginxController) OnUpdateNginx(oldObj, newObj interface{}) {
	// 把event存到workqueue
	nginxController.EnqueueNginx(newObj)
}

func (nginxController *NginxController) OnDeleteNginx(obj interface{}) {
	// 把event存到workqueue
	nginxController.EnqueueNginx(obj)
}

// 消费workqueue
func (nginxController *NginxController) runNginxWorker() {
	for {
		nginxController.processNginxEvent()
	}
}

// 处理event
func (nginxController *NginxController) processNginxEvent() {
	var (
		obj interface{}
		key string
		ok bool
		shutdown bool
		err error
	)

	if obj, shutdown = nginxController.NginxWorkqueue.Get(); shutdown {
		return
	}

	// 处理结束, 从队列删除
	defer nginxController.NginxWorkqueue.Done(obj)

	// workqueue的key
	if key, ok = obj.(string); !ok {
		nginxController.NginxWorkqueue.Forget(obj)
		return
	}

	////////// 核心逻辑 ////////////
	if err = nginxController.handleNginxEvent(key); err != nil && !errors.IsNotFound(err) {
		goto FAIL
	}

	// 处理成功，重置失败计数
	nginxController.NginxWorkqueue.Forget(obj)
	return

FAIL:
	klog.Errorln("[Nginx - 处理异常]", key, err)
	// 处理失败, 重新放回队列, 累加限速计数
	nginxController.NginxWorkqueue.AddRateLimited(key)
}

func (nginxController *NginxController) handleNginxEvent(key string) (err error) {
	var (
		namespace string
		name string
		nginx *nginx_v1.Nginx
		pods []v1.Pod
		requirement *labels.Requirement
		selector labels.Selector
		pod v1.Pod
		created *v1.Pod
		podId int
		podCount int
		nginxNotFound bool = false
		running int
		pending int
		podList *v1.PodList
	)

	// 反解workqueue的key, 得到namespace/name
	if namespace, name, err = cache.SplitMetaNamespaceKey(key); err != nil {
		return
	}

	// 获取local cache里的对应Nginx object
	if nginx, err = nginxController.NginxInformer.Lister().Nginxes(namespace).Get(name); err != nil && !errors.IsNotFound(err) {
		return
	}
	if errors.IsNotFound(err) {
		nginxNotFound = true
	}

	// 筛选出关联的POD
	selector = labels.NewSelector()
	if requirement, err = labels.NewRequirement("nginxKey", selection.Equals, []string{key}); err != nil {
		return
	}
	selector = selector.Add(*requirement)	// 注意返回值覆盖

	// 出于调度实时性的需要, POD列表取apiserver最新的状态, 不走local cache
	if podList, err = nginxController.Clientset.CoreV1().Pods(namespace).List(core_v1.ListOptions{LabelSelector: selector.String()}); err != nil {
		return
	}
	pods = podList.Items
	//if pods, err = nginxController.PodInformer.Lister().Pods(namespace).List(selector); err != nil {
	//	return
	//}

	// 现有POD数量
	podCount = len(pods)

	// nginx已删除, 清理所有关联PODS
	if nginxNotFound {
		for i := 0; i < podCount; i++ {
			if err = nginxController.Clientset.CoreV1().Pods(pods[i].Namespace).Delete(pods[i].Name, nil); err != nil && !errors.IsNotFound(err) {
				return
			}
			klog.Infoln("[Nginx - 清理POD]", key, pods[i].Name)
		}
		return
	}

	// Nginx部署策略: 确保足够数量的POD运行即可
	// 1, running+pending<replicas, 那么创建
	// 2, running+pending>replicas, 那么删除
	// 3, 其他状态的删除

	// 统计一下running和pending的POD个数
	for i := 0; i < podCount; i++ {
		if pods[i].Status.Phase == v1.PodRunning {
			running++
		} else if pods[i].Status.Phase == v1.PodPending {
			pending++
		} else { // 其他状态的删除
			if err = nginxController.Clientset.CoreV1().Pods(pods[i].Namespace).Delete(pods[i].Name, nil); err != nil && !errors.IsNotFound(err) {
				return
			}
		}
	}

	podId = int(time.Now().UnixNano())

	// 扩容
	if running + pending < nginx.Spec.Replicas {	// 不足就补充
		toScale := nginx.Spec.Replicas - running - pending
		for i := 0; i < toScale; i++ {
			pod = v1.Pod{
				ObjectMeta: core_v1.ObjectMeta{
					Name:   "nginx-pod-" + strconv.Itoa(podId),
					Labels: map[string]string{"nginxKey": key},
				},
				Spec: v1.PodSpec{
					Containers: []v1.Container{
						{Name: "nginx", Image: "nginx:latest"},
					},
				},
			}
			if namespace = nginx.Namespace; namespace == "" {
				namespace = "default"
			}
			if created, err = nginxController.Clientset.CoreV1().Pods(namespace).Create(&pod); err != nil {
				return
			}
			pods = append(pods, *created)
			podId++
			podCount++

			klog.Infoln("[Nginx - 扩容POD]", key, created.Name)
		}
	} else if running + pending > nginx.Spec.Replicas { // 缩容
		toDelete := running + pending - nginx.Spec.Replicas
		// 先删pending的
		for i := 0; i < len(pods); i++ {
			if toDelete == 0 {
				break
			}
			if pods[i].Status.Phase != v1.PodPending {
				continue
			}
			if err = nginxController.Clientset.CoreV1().Pods(pods[i].Namespace).Delete(pods[i].Name, nil); err != nil && !errors.IsNotFound(err) {
				return
			}
			toDelete--
			klog.Infoln("[Nginx - 缩容POD]", key, pods[i].Name)
		}
		// 再删running的
		for i := 0; i < len(pods); i++ {
			if toDelete == 0 {
				break
			}
			if pods[i].Status.Phase != v1.PodRunning {
				continue
			}
			if err = nginxController.Clientset.CoreV1().Pods(pods[i].Namespace).Delete(pods[i].Name, nil); err != nil && !errors.IsNotFound(err){
				return
			}
			toDelete--
			klog.Infoln("[Nginx - 缩容POD]", key, pods[i].Name)
		}
	}

	klog.Infoln("[Nginx - 更新]", key, "running:", running, "pending:", pending, "total:", podCount)
	return
}
