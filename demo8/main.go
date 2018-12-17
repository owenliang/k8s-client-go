package main

import (
	"k8s.io/klog"
	"flag"
)

// k8s所有代码都会使用klog库, 所以我们需要配置一下klog, 让k8s sdk内部日志输出到合适的文件中
// 执行 ./demo8 -h可以看到klog接收的命令行参数

// 实际使用时, 就是指定-log-dir=参数，日志会输出到目录下，并且每1.8G会切换一次文件
// 过期的文件需要我们自己去删除，整个用法和glog风格一致，可以去看klog源码

func main() {
	// 可以先定义自己的flag命令行参数
	// ....

	// 然后注册klog库需要的命令行参数
	klog.InitFlags(nil)

	// 强制覆盖klog的部分命令行参数
	flag.Set("stderrthreshold", "4") // 禁止klog输出任意级别日志到终端

	// 然后解析命令行参数, 这样klog以及我们都可以得到所需的命令行参数
	flag.Parse()

	// 这种输出日志不受v参数影响, 总是输出
	klog.Infof("hello %s", "word")

	// 这种带V的日志, 只有v级别开到足够高才会打印出来, 这是google log的风格
	klog.V(5).Info("需要-v 5或者以上才可以打印出来!")

	// 退出程序前, 把缓存在内存里的日志刷新到磁盘
	defer klog.Flush()

	// 尝试这样启动程序, 可以看到所有日志
	// ./demo8 -log_dir=./log -log_dir=log -v 6
	return
}
