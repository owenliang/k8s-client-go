# k8s-client-go

一些调研k8s client-go用法的小demo

# 清单

* demo1: 连接k8s
* demo2: 解析yaml为json, 反序列化到deployment对象, 修改deployment.spec.replicas, 提交到k8s生效
* demo3: 更新deployment.Spec.Template.Spec.Containers, 升级镜像版本, 提交到k8s生效

# 参考

* [client-go doc](https://godoc.org/k8s.io/client-go/kubernetes)