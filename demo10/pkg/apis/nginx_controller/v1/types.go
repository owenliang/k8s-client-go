package v1

import (
	meta_v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// 单个object, 例如：kubectl get nginxes.mycompany.com {name} -o yaml
type Nginx struct {
	meta_v1.TypeMeta   `json:",inline"`	// Kind, ApiVersion
	meta_v1.ObjectMeta `json:"metadata"`	// metadata.name, metadata.namespace等...
	Spec Spec   `json:"spec"`
	Status Status `json:"status, omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// object列表, 例如：kubectl get nginxes.mycompany.com -o yaml
type NginxList struct {
	meta_v1.TypeMeta `json:",inline"`	// Kind总是List
	meta_v1.ListMeta `json:"metadata"`
	Items            []Nginx `json:"items"`
}

// 自定义
type Spec struct {
	Replicas int `json:"replicas"`
}

// 自定义
type Status struct {
	Message string `json:"message,omitempty"`
}