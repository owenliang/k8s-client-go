package main

import (
	"net/http"
	"github.com/owenliang/k8s-client-go/demo6/ws"
	"github.com/gorilla/websocket"
)

func wsHandler(resp http.ResponseWriter, req *http.Request) {
	var (
		wsConn *ws.WsConnection
		err error
	)

	if wsConn, err = ws.InitWebsocket(resp, req); err != nil {
		return
	}

	wsConn.WsWrite(websocket.TextMessage, []byte("hello k8s"))
	// wsConn.WsClose()
}

func main() {
	http.HandleFunc("/ssh", wsHandler)
	http.ListenAndServe("localhost:7777", nil)
}