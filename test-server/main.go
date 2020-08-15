package main

import "github.com/rpccloud/rpc"

func main() {
	userService := rpc.NewService().
		Reply("SayHello", func(ctx rpc.Context, userName string) rpc.Return {
			return ctx.OK("hello " + userName)
		})

	rpc.NewServer().SetNumOfThreads(1).
		AddService("user", userService).
		ListenWebSocket("127.0.0.1:8080").
		Serve()
}
