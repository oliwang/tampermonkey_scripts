// ==UserScript==
// @name         大麦抢票-选场次票价人数
// @namespace    https://www.jwang0614.top/scripts
// @version      0.8.1
// @description  辅助购买大麦网演唱会门票
// @author       Olivia Wang
// @match        https://detail.damai.cn/*
// @grant        none
// @require      http://code.jquery.com/jquery-1.11.1.min.js
// ==/UserScript==

var sellStartTime_timestamp = null;
var order_url = null;
var timer = null;
var itemId = null;
var email = null;
var name = null;
var duration = null;

$(document).ready(function(){
    window.current_url = window.location.href;
    var data = sessionStorage.getItem('order_url');
    if (data) {
        window.location.href = data;
    } else {
        
        var service_note_name_seat = $('.service-note .service-note-name:first').text().trim();

        if($("div.buybtn").text() === "选座购买" || service_note_name_seat === "可选座"){
            alert("目前不支持选座");
        }

        else {
            insert_ui();
        }


    }

});

function insert_ui() {
    var $service = $(".content-right .service");

    var $style = $('<style>'+
        '#control_container{margin: 20px 0; background:#e9e9e9;padding:20px 0;}'+
        '#control_container button{width:80%;margin:10px 10%;padding:10px 0;font-size:30px;border-style: solid;}'+
        '#start_btn{color:green;}'+
        '#end_btn{color:red;}'+
        '.input_wrapper{display: flex;justify-content:center;font-size: 16px; margin-bottom:10px;}'+
        '.notice{margin:10px 10px;padding:10px 10px;color:darkslategrey;border-style: solid; border-width: 1px; border-color:darkslategrey;}'+
        '#wx{text-align: center;}'+
        '#countdown_wrapper {display:none; font-size: 16px; text-align:center; background:#ffeaf1;}'+
        '#countdown_wrapper p{width:100%;}'+
        '#countdown {font-size: 20px; color:#ff1268;}'+
        '</style>');

    var $control_container = $("<div id='control_container'></div>");

    var $wx = $('<div id="wx" class="notice"><p>公众号：伪装程序大佬(wzcxdl_cs)</p></div>');

    var $number_input = $('<div class="input_wrapper" id="number_input_wrapper">请输入人数：<input id="number_input" type="number" value="1" min="1" max="6"></div>');
    var $email_input = $('<div class="input_wrapper" id="email_input_wrapper">email：<input id="email_input" type="email" value="example@hotmail.com"></div>');
    var $name_input = $('<div class="input_wrapper" id="name_input_wrapper">联系人姓名：<input id="name_input" type="text" value="小明"></div>');
    var $duration_input = $('<div class="input_wrapper" id="duration_input_wrapper">刷新间隔(ms)：<input id="duration_input" type="text" value="5000"></div>');

    var $start_btn = $('<button id="start_btn">开始抢票</button>');
    var $end_btn = $('<button id="end_btn">停止抢票</button>');
    var $notice = $('<div id="notice" class="notice"><h3>使用步骤</h3><p>0.登录，填写购票人信息</p><p>1.选择场次</p><p>2.选择价格</p><p>3.填写人数</p><p>4.点击‘开始抢票’</p></div>');

    var $notice2 = $('<div id="notice2" class="notice"><p>倒计时相差1-2秒是四舍五入造成的正常现象</p><p>若误差过大请校准计算机时间，刷新页面</p></div>');
    var $notice3 = $('<div id="notice3" class="notice"><p>若不想每次输入email，联系人姓名，刷新间隔</p><p>请自行修改本脚本63-65行 email，联系人，刷新间隔的value</p></div>');

    var $countdown = $('<div id="countdown_wrapper"><p id="selected_event">event1</p><p id="selected_price">price2</p><p id="selected_number">1人</p><br><p>倒计时:</p><p id="countdown">00:00:00</p></div>');

    $control_container.append($style);
    $control_container.append($wx);
    $control_container.append($number_input);
    $control_container.append($email_input);
    $control_container.append($name_input);
    $control_container.append($duration_input);
    $control_container.append($start_btn);
    $control_container.append($end_btn);
    $control_container.append($notice);
    $control_container.append($notice2);
    $control_container.append($notice3);
    // $control_container.append($countdown);

    $control_container.insertBefore($service);
    $countdown.insertBefore($control_container);

    $("#start_btn").click(function(){
        var event = $(".perform__order__select.perform__order__select__performs .select_right_list .active span:last-of-type").text();
        var price = $(".select_right_list_item.sku_item.active .skuname").text();
        var people_num = $("#number_input").val();
        var email = $("#email_input").val();
        var name = $("#name_input").val();
        var duration = $("#duration_input").val();
        var data_json = JSON.parse($("#dataDefault").text());
        window.sellStartTime_timestamp = data_json["sellStartTime"];

        // console.log("sellStartTime_timestamp: " + sellStartTime_timestamp);
        // console.log("now: " + Date.now());

        // console.log(data_json);

        $("#selected_event").text(event);
        $("#selected_price").text(price);
        $("#selected_number").text(people_num + "人");

        $("#countdown_wrapper").show();


        var result = generate_confirm_url_m(event, price, people_num,data_json);

        if(result) {
            window.order_url = result;
            sessionStorage.setItem('order_url', result);
            window.email = email;
            sessionStorage.setItem('email', email);
            window.name = name;
            sessionStorage.setItem('name', name);
            window.duration = duration;

            console.log("countdown and go to confirm page");
            timedUpdate();


        } else {
            console.error("不知道为什么获取场次票价人数出错了呢。");
            alert("不知道为什么获取场次票价人数出错了呢。");

        }





    });

    $("#end_btn").click(function(){
        clearTimeout(window.timer);
        $("#countdown_wrapper").hide();
        sessionStorage.clear();
    });

}


function generate_confirm_url_m(event, price, people_num, data_json) {
    var performBases = data_json["performBases"];
    var itemId = "";

    for(var i=0; i<performBases.length; i++) {
        var performBase = performBases[i];
        var performs = performBase["performs"];
        for(var j=0; j<performs.length; j++) {
            var perform = performs[j];
            if(perform["performName"] === event) {
                itemId = perform["itemId"];
                window.itemId = itemId;
                var skuList = perform["skuList"];
                for(var k=0; k<skuList.length; k++) {
                    var skuList_item = skuList[k];
                    if(skuList_item["skuName"] === price) {
                        var skuId = skuList_item["skuId"];
                        return "https://m.damai.cn/app/dmfe/h5-ultron-buy/index.html?buyParam=" + itemId + "_" + people_num + "_" + skuId + "&buyNow=true&spm=a2oeg.project.projectinfo.dbuy"

                    }
                }

            }
        }

    }
    return null;

}

function timedUpdate() {
    // 提前2秒开始
    var current_time = Date.now();
    var time_difference = Math.ceil((window.sellStartTime_timestamp - current_time)/1000);
    if (time_difference < 2) {
        var m_url = window.order_url + "&email=" + encodeURI(window.email) + "&name=" + encodeURI(window.name) + "&duration=" + encodeURI(window.duration);
        window.location.href = m_url;
        sessionStorage.setItem('order_url', m_url);
        // sessionStorage.setItem('email', window.email);

        // window.location.href = window.order_url;
    } else {
        var time_difference_str = time_difference.toHHMMSS();
        $("#countdown").text(time_difference_str);

        window.timer = setTimeout(timedUpdate, 1000);

    }

}




//https://stackoverflow.com/a/31112615
Number.prototype.toHHMMSS = function() {
    var hours = Math.floor(this / 3600) < 10 ? ("00" + Math.floor(this / 3600)).slice(-2) : Math.floor(this / 3600);
    var minutes = ("00" + Math.floor((this % 3600) / 60)).slice(-2);
    var seconds = ("00" + (this % 3600) % 60).slice(-2);
    return hours + ":" + minutes + ":" + seconds;
};

