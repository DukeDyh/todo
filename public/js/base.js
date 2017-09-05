;(function(){
	"use strict";
	
	var $form_add_task = $(".add-task")
	,task_list=[]
	,$delete_task = $(".delete")
	,$task_detail = $(".tasks-detail")
	,$task_edit = $(".edit")
	,task_list_done=[]
	,page=1
	,length = 0
	,limit
	,pages
	;
	
	init();
	
	$form_add_task.on("submit",function(e){
		var new_task={};
		e.preventDefault();
		new_task.content = $(this).find('input[name=content]').val();
		if(!new_task.content) return;
		
		add_task(new_task);
	
		$("input[name=content]").val("");
	});
	
	
	$("input[name=content]").focus(function(){
		$(document).keydown(function(e){
			if(e.keycode==13){
				new_task.content = $(this).find('input[name=content]').val();
				if(!new_task.content) return;
				add_task(new_task);
			}
		});
		$("input[name=content]").val("");
	});
	//监听详情事件
	function listen_task_detail(){
		$(".edit").on("click",function(){
			render_task_detail($(this).parent().parent().data("index"));
			task_detail_update($(this).parent().parent().data("index"));
			$(".tasks-detail").fadeIn();
			$("#bg").fadeIn();
		});
	}
	function listen_task_detail_remove(index){
		$(".remove").on("click",function(){
			$(".tasks-detail").fadeOut();
			$("#bg").fadeOut();
			if(task_list[index].inform=="true"){
				task_list[index].state = "done";
				store.set("task_list",task_list);
				refresh_task_list(page);
			}
		});
	}
	//监听详情更新事件
	function task_detail_update(index){
		var $btn = $(".tasks-detail").find(".btn");
		$btn.on("click",function(){
			task_list[index].content = $(".content").val();
			task_list[index].desc = $(".desc").val();
			task_list[index].remindDate = $(".remind").find("input").val();
			task_list[index].state = "todo";
			task_list[index].inform = "false";
			store.set("task_list",task_list);
			refresh_task_list(page);
			$(".tasks-detail").fadeOut();
			$("#bg").fadeOut();
			
		});
	}
	//查找并监听所有删除按钮的监听事件
	function listen_delete(){
		$delete_task.on("click",function(){
			var self = $(this);
			$("#bg").fadeIn();
			$("#notice").fadeIn();
			$(".notice_detail").text("取消");
			$(".notice_content").text("您确定要删除该事件吗？");
			$(".notice_confirm").click(function(){
				delete_task(self.parent().parent().data("index"));
				$("#bg").fadeOut();
				$("#notice").fadeOut();
			});
			$(".notice_detail").click(function(){
				$("#bg").fadeOut();
				$("#notice").fadeOut();
			});
			refresh_task_list(page);
		});
	}

	function add_task(new_task){
		//将新task推入task_list
		task_list.unshift(new_task);
		//更新localStorge
		refresh_task_list(page);
		return true;
	}
	//初始化
	function init(){
		task_list = store.get("task_list")||[];
		task_list.forEach(function(e){
			if(e==null){}else{
				length++;
			}
		});
		limit = Math.floor(($(window).height()-300)/46);
		pages = Math.ceil(length/limit);
		if(task_list.length){
			render_task_list(1);
		}
		listen_delete();
		listen_task_detail();
		listen_tasks_state();
		listen_checkbox();
		task_remind_check();
		listen_pageChange();
		$(".pagers").text(page+"/"+pages);
		if($(window).width()<768){
			$(".edit").text("");
			$(".delete").text("");
		}
	}
	
	//渲染全部模板分页
	function render_task_list(page){
		console.log(pages);
		console.log(page);
		console.log(limit);
		var $task_list = $(".tasks-item");
		$task_list.html("");
		for(var i = (page-1)*limit; i < page*limit; i++){
			var $task = render_task_item(task_list[i],i);
			$task_list.append($task);
		}
		$delete_task = $(".delete");
		
	}
	//	渲染单条task模板
	function render_task_item(data,index){
		if(data==undefined||index==undefined) return;
		if(data.state=="done"){
			var list_item_tpl='<li class="tasks-list list-group-item" data-index= ' +index +' style="background:#e5e5e5">'
			+				'<input type="checkbox" checked class="state" style="top=-10px">'
			+				'<span class="task-content">'+ data.content +'</span>'
			+				'<span class="options">'
			+				'<span class="glyphicon glyphicon-cog option edit">'+'详情'+'</span>'
			+				'<span class="glyphicon glyphicon-trash delete option">'+'删除'+'</span>'
			+			  '</li>';
		}else{
			var list_item_tpl='<li class="tasks-list list-group-item" data-index= ' +index +'>'
			+				'<input type="checkbox" class="state" style="top=-10px">'
			+				'<span class="task-content">'+ data.content +'</span>'
			+				'<span class="options">'
			+				'<span class="glyphicon glyphicon-cog option edit">'+'详情'+'</span>'
			+				'<span class="glyphicon glyphicon-trash delete option">'+'删除'+'</span>'
			+			  '</li>';
		}
		return $(list_item_tpl);
	}
	function render_task_detail(index){
		var item = task_list[index];
		if(!item.desc) item.desc = "";
		var detail_tpl = 
		   '<span class="glyphicon glyphicon-remove remove"></span>'
		 +	'<input class="content form-control" placeholder="摘要" value='+ item.content +'>'
		 +	'</input>'
		 +	'<textarea class="desc form-control" rows="6">'
		 +   item.desc
		 +	'</textarea>'
		 +	'<h2 class="h3" style="font-weight: bold;">提醒时间</h2>'	
		 +	'<div class="remind">'
		 +		'<input class="form-control" value="'+ (item.remindDate||"") + '"/>'	
		 +		'<button class="btn btn-default" style="margin:10px 0;">更新</button>'
		 +  '</div>';
		 $task_detail.html("");
		 $task_detail.html(detail_tpl);
		 listen_task_detail_remove(index);
		 $(".remind").find("input").datetimepicker();
		 listen_tasks_state();
	}
	function refresh_task_list(page){
		store.set("task_list",task_list);
		render_task_list(page);
		listen_delete();
		listen_task_detail();
		listen_tasks_state();
		listen_checkbox();
	}
	function listen_checkbox(){
		$('input').iCheck({
		    checkboxClass: 'icheckbox_minimal-blue',
		    radioClass: 'iradio_minimal-blue',
		    increaseArea: '20%' // optional
		  });
	}
	//删除一条task
	function delete_task(index){
	if(index==undefined||!task_list[index]) return;
		delete task_list[index];
		refresh_task_list(page);
	}
	
	//监听列表状态完成or未完成
	function listen_tasks_state(){
		$(".state").on("ifChecked",function(e){
			var index = $(this).parent().parent().data("index");
			task_list[index].state = "done";
			store.set("task_list",task_list);
			refresh_task_list(page);
		});
		$(".state").on("ifUnchecked",function(){
			var index = $(this).parent().parent().data("index");
			task_list[index].state = "todo";
			task_list[index].inform = "false";
			store.set("task_list",task_list);
			render_task_item(task_list[index],index);
			$(this).css("background","white");
			refresh_task_list(page);
		});
	}
	//提醒
	function task_remind_check() {
		var current_time;
		
		var itl = setInterval(function(){
			for(var i=0;i<task_list.length;i++){
				var item = task_list[i],task_time;
				if(!item||!item.remindDate||item.state=="done"||item.inform=="true"){
					continue;
				}else{
					current_time = (new Date()).getTime();
					task_time = (new Date(item.remindDate)).getTime();
					if(current_time-task_time>=1){
						item.inform = "true";
						store.set("task_list",task_list);
						notify(item,i);
					}
				}
			}
		},500);
	}
	
	function notify(item,index) {
		$("#bg").fadeIn();
		$("#notice").fadeIn();
		$(".notice_detail").text("详情");
		$(".notice_content").text("时间到了！快去"+item.content+"吧！");
		$(".notice_confirm").click(function(){
			$("#bg").fadeOut();
			$("#notice").fadeOut();
			item.state="done";
			refresh_task_list(page);
		});
		$(".notice_detail").click(function(){
			$("#bg").fadeOut();
			$("#notice").fadeOut();
			render_task_detail(index);
			task_detail_update(index);
			$(".tasks-detail").fadeIn();
		});
	}
	//切换页面
	function listen_pageChange(){
		console.log(1);
		$("#prev").click(function(){
			page = page - 1;
			if(page<1){
				page=1;
			}
			$(".pagers").text(page+"/"+pages);
			refresh_task_list(page);
		});
		$("#next").click(function(){
			page = page + 1;
			if(page>pages){
				page=pages
			}
			$(".pagers").text(page+"/"+pages);
			refresh_task_list(page)
		});
	}
	$(window).resize(function(){
		limit = Math.floor(($(window).height()-300)/46);
		pages = Math.ceil(length/limit);
		refresh_task_list(page);
		if($(window).width()<768){
			$(".edit").text("");
			$(".delete").text("");
		}
		$(".pagers").text(page+"/"+pages);
	});
})();

