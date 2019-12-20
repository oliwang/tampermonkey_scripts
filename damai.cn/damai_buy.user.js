// ==UserScript==
// @name         大麦抢票-确认
// @namespace    https://www.jwang0614.top/scripts
// @version      0.8.1
// @description  辅助购买大麦网演唱会门票
// @author       Olivia Wang
// @match        https://m.damai.cn/app/dmfe/h5-ultron-buy/index.html?*
// @grant        none
// @require      http://code.jquery.com/jquery-1.11.1.min.js
// ==/UserScript==


var test_url = "https://buy.damai.cn/orderConfirm?exParams=%7B%22damai%22%3A%221%22%2C%22channel%22%3A%22damai_app%22%2C%22umpChannel%22%3A%2210002%22%2C%22atomSplit%22%3A%221%22%2C%22serviceVersion%22%3A%221.8.5%22%7D&buyParam=600583263497_1_4192587404863&buyNow=true&spm=a2oeg.project.projectinfo.dbuy"

var timer = null;
var current_url = null;

var max_time = 5000;
var current_time = 500;

var email = null;
var name = null;
var duration = null;

$(document).ready(function(){
    window.current_url = window.location.href;

    var str = window.current_url;
    var email_result = str.match(/&email=(\S+)&name=(\S+)&duration=(\S+)/);

    if (!email_result) {
        var itemId_result = str.match(/buyParam=(\d+)_/);
        var itemId = itemId_result[1];
        alert("请从detail.damai.cn开始");
        window.location.href = "https://detail.damai.cn/item.htm?id=" + itemId;

    }

    
    window.email = decodeURI(email_result[1]);
    window.name = decodeURI(email_result[2]);
    window.duration = parseInt(decodeURI(email_result[3]));


    webpageLoaded().then(res=>{
        console.log("webpageLoaded success");
        Promise.all([fillBuyer(), fillEmail(), fillName()]).then(res=>{
            // m_check_after_buyer_click();
            check_loading_container().then(res=>{
                alert("应该已经生成订单啦,去订单管理看看https://orders.damai.cn/orderList");
            }).catch(err=>{
                setTimeout(function(){
                    // window.location.reload();
                     window.location.href = window.current_url;
                }, window.duration);
            });
        })
    }).catch(err=>{
        console.log("webpageLoaded failed");
        setTimeout(function(){
            // window.location.reload();
            window.location.href = window.current_url;
        }, window.duration);
        // window.location.href = window.current_url;
    });


});



// https://bbs.csdn.net/topics/394866482?list=26324410
function creatEventAndDispatch (el, e) {
    var event = document.createEvent('Events');
    event.initEvent(e, true, true);
    el.dispatchEvent(event);
}


function check_loading_container() {
    return new Promise(function(resolve, reject){
        function checkLoadingContainer() {
            var lc = $(".loading-container");
            console.log(lc.css("display"));
            var widget = $(".J_MIDDLEWARE_FRAME_WIDGET");
            // #loading #confirm
            // 重复提交
            // 重新提交

            if (lc.css("display") == "none") {
                var divs = $("div:contains('提交订单')");
                console.log("not loading", divs)
                creatEventAndDispatch(divs[divs.length-1], 'dx_tap');
            } else if (widget.length > 0) {
                console.log("flex fail");
                clearInterval(intervalID);
                reject();

            }else {
                var success_msg = $("div:contains('未支付')");
                var fail_msg = $("div:contains('重新提交')");
                var confirm = $("#confirm.loading-container:contains('返回')");
                
                if (success_msg.length > 0) {
                    console.log("success");
                    clearInterval(intervalID);
                    resolve();
                } else if (fail_msg.length > 0) {
                    console.log("fail");
                    clearInterval(intervalID);
                    reject();
                } else if (confirm.length > 0) {
                    console.log("confirm", confirm[0]);
                    var cancel_divs = $("#confirm.loading-container div:contains('取消')");
                    var cancel = cancel_divs[cancel_divs.length - 1];
                    console.log("cancel", cancel)
                    var back_divs = $("#confirm.loading-container div:contains('返回')");
                    var back = back_divs[back_divs.length - 1];
                    console.log("back", back);
                    creatEventAndDispatch(back, 'dx_tap');

                } else {
                    console.log("keep waiting");
                }

            }

            

        }

        var intervalID = setInterval(checkLoadingContainer, 200);
    });
}

function webpageLoaded() {
    return new Promise(function(resolve, reject){
        var total_wait = 0;
        function checkWebpageLoaded() {
            total_wait += 100;
            if (total_wait > 2000 || $(".J_MIDDLEWARE_FRAME_WIDGET").length > 0) {
                console.log($(".J_MIDDLEWARE_FRAME_WIDGET"), "length > 0");
                clearInterval(intervalID);
                reject();
            }

            var divs = $("div:contains('提交订单')");
            

            if (divs.length > 0) {
                clearInterval(intervalID);
                resolve();
            }
        }
        var intervalID = setInterval(checkWebpageLoaded, 100);

    });
}

function fillBuyer() {
    return new Promise(function(resolve, reject){
        var desc = $("#dmViewerBlock_DmViewerBlock .tpl-wrapper>div>div>div:nth-child(2)");

        if (desc.length == 0) {
            resolve();
        } else {
            var text = $("#dmViewerBlock_DmViewerBlock .tpl-wrapper>div>div>div:nth-child(2)").text();
            var num = text.match(/\d+/g).map(Number);
            for(let i = 0; i < num; i++) {

                $(".viewer i")[i].click();
            }

            resolve();

        }

    });
}

function fillName() {
    return new Promise(function(resolve, reject){
        var desc = $("div[view-name='MInput'] input[placeholder='请填写联系人姓名']");

        if (desc.length == 0) {
            resolve();
        } else {
            var input = $("div[view-name='MInput'] input[placeholder='请填写联系人姓名']");
            console.log("input", input[0]);
            var name = window.name;
            console.log("name", name);
            input[0].value = name;
            creatEventAndDispatch(input[0], 'input');
            creatEventAndDispatch(input[0], 'change');

            resolve();

        }

    });
}

function fillEmail() {
    return new Promise(function(resolve, reject){
        var desc = $("div[view-name='MInput'] input[placeholder='请填写联系人邮箱']");

        if (desc.length == 0) {
            resolve();
        } else {
            var input = $("div[view-name='MInput'] input[placeholder='请填写联系人邮箱']");

            console.log("input", input[0]);
            var email = window.email;
            console.log("email", email);
            input[0].value = email;
            creatEventAndDispatch(input[0], 'input');
            creatEventAndDispatch(input[0], 'change');

            resolve();

        }

    });

}










