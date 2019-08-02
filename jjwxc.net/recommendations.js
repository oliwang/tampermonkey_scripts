// ==UserScript==
// @name         晋江小说推荐
// @namespace    https://jwang0614.top/
// @version      0.2
// @description  在晋江页面推荐相似小说
// @author       Olivia
// @match        http://www.jjwxc.net/onebook.php?novelid=*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @require      https://unpkg.com/axios/dist/axios.min.js
// @require      http://code.jquery.com/jquery-1.11.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

//get user ip
var $ip_js = $('<script type="text/javascript">var userip;</script>');
var $ip_tag = $('<script type="text/javascript" src="https://l2.io/ip.js?var=userip"></script>');
$ip_tag.insertAfter("#sitehead");
$ip_js.insertAfter("#sitehead");


$(document).ready(function(){

    const novel_id = window.location["search"].split("=")[1];
    console.log(novel_id);

    var category = $.trim($(".rightul li span")[1].innerHTML);
    console.log(category);
    var category_list = category.split("-");
    var preference_originality = category_list[0] + "-" + category_list[1];
    console.log(preference_originality);

    const url = "http://jwang0614.top/jjwxc_recommender/books/" + novel_id + "/?format=json";
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: response => {

            if(response && response.status === 200) {
                // console.log("success");
                const info = JSON.parse(response.response);
                // console.log(info);

                const recommendations = JSON.parse(info["recommendations"]);
                const category_rank = recommendations["category_rank"];
                const category_score_rank = recommendations["category_score_rank"];
                const preference_rank = recommendations["preference_rank"];
                const preference_score_rank = recommendations["preference_score_rank"];

                const rank_dict =  {
                    "category_rank": category_rank,
                    "category_score_rank": category_score_rank,
                    "preference_rank": preference_rank,
                    "preference_score_rank": preference_score_rank
                };

                // console.log(rank_dict);

                var novel_count = 0;
                var novel_total = 0;

                for(var key in rank_dict){
                    novel_total = novel_total + rank_dict[key].length;
                    // console.log(key, rank_dict[key]);
                }
                // console.log(novel_total);

                var novel_info_dict = {};

                for (var key in rank_dict) {
                    for (var id in rank_dict[key]) {
                        GM_xmlhttpRequest ( {
                            method:     "GET",
                            url:        "http://jwang0614.top/jjwxc_recommender/books/" + rank_dict[key][id] + "/?format=json",
                            context:    rank_dict[key][id],
                            onload:     parseInfo,
                            onerror:    function (e) { console.error ('**** error ', e); },
                            onabort:    function (e) { console.error ('**** abort ', e); },
                            ontimeout:  function (e) { console.error ('**** timeout ', e); }
                        } );
                    }
                }

                function parseInfo(response) {
                    var info = JSON.parse(response.response);
                    // console.log(info);
                    var result = {"novel_id": info["novel_id"], "author": info["author"], "title": info["title"]};
                    novel_info_dict[result["novel_id"]] = result;
                    novel_count++;

                    if (novel_count === novel_total) {
                        displayFinalResult();
                    }


                }

                function displayFinalResult() {

                    // console.log(novel_info_dict);

                    const zh_key_dict = {"category_rank": category, "category_score_rank":category + "(积分)", "preference_rank": preference_originality, "preference_score_rank":preference_originality + "(积分)"};

                    var $table = $('<table style="width: 984px; margin:10px auto;table-layout: fixed; background:lightgoldenrodyellow;"><tr><th></th><th>#01</th><th>#02</th><th>#03</th><th>#04</th><th>#05</th><th>#06</th><th>#07</th><th>#08</th><th>#09</th><th>#10</th></tr></table>');

                    for (var key in rank_dict) {
                        var $table_row = $('<tr style="margin: 10px auto;"><td>'+ zh_key_dict[key] + '</td></tr>');
                        for (var item_id in rank_dict[key]) {
                            const n_id = rank_dict[key][item_id];
                            const n_info = novel_info_dict[n_id];


                            var $table_cell = $('<td class="novel" style="padding: 10px 10px;"><p class="title"><a title="这里是显示的文字" data-index="'+item_id+'" data-type="'+key+'" data-nid="'+n_id+'" data-novelid="'+novel_id+'" style="color:green" href="http://www.jjwxc.net/onebook.php?novelid='+ n_id +'">'+n_info["title"]+'</a></p><p class="author" style="color:grey;">by:' + n_info["author"]  + '</p></td>')
                            $table_row.append($table_cell);

                        }
                        $table.append($table_row);
                    }

                    $table.insertAfter("#sitehead");

                    $("td.novel a").click(function(event){
                        const data = event.target.dataset;
                        const novel_id = parseInt(data["novelid"]);
                        const n_id = parseInt(data["nid"]);
                        const item_type = data["type"];
                        const item_index = parseInt(data["index"]);

                        const url = "http://jwang0614.top/jjwxc_recommender/bookRecommendationHistorys/";

                        const history_data = JSON.stringify({"current_novel_id": novel_id, "user_clicked_novel_id": n_id, "click_item_type": item_type, "click_item_rank": item_index, "user_ip": userip});

                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: url,
                            data: history_data,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            onload: response => {
                                if (response.status === 201) {
                                    console.log("success save history");

                                }else {
                                    console.error("failed to save history");
                                }

                            },
                            onerror:    function (e) { console.error ('**** error ', e); },
                            onabort:    function (e) { console.error ('**** abort ', e); },
                            ontimeout:  function (e) { console.error ('**** timeout ', e); }
                        });
                    });




                }



            }
            else {
                alert("我的数据库里还没这本书呢。\n关注我公众号「伪装程序大佬」提醒我加上它。\n发送'晋江新书 " + novel_id+ "'。")
            }
        }
    });




});


    
})();
