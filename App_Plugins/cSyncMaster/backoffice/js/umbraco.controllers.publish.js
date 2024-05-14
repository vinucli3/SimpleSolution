

angular.module('umbraco').controller('PublishTocontroller', function ($filter, $scope, appState, contentResource, $http, umbRequestHelper, editorService, $location, $sce) {

    var vm = this;
    var apiUrl = umbRequestHelper.getApiUrl("publishBaseUrl", "")
    vm.url = document.getElementById("urlAddress");
    $scope.server = false;
    $scope.report = false;
    $scope.difference = false;
    $scope.changeDet = false;
    $scope.noChangeView = false;
    $scope.loader = false;
    $scope.pubComplt = false;
    $scope.detail = true;
    $scope.detailTab = true;
    $scope.viewTab = false;
    $scope.disableItem = false;
    $scope.expand = true;
    $scope.pubEnable = true;
    vm.desc = "Select a server for publish";
    vm.title = "Select a server";
    vm.selectSite = [];
    allNodes = [];
    $scope.nodesNeedToPublish = [];
    vm.Active = "";
    $scope.nodeDifference = [];
    $scope.selectServer = "";
    /************/
    $scope.removeRemoteChild = false;
    $scope.addChild = true;
    $scope.deleteItems = true;
    $scope.showChild = false;
    $scope.enableChild = false;
    /************/
    var inputs = [];
    vm.changeTab = function (selectedTab) {
        vm.tabs.forEach(function (tab) {
            tab.active = false;
        });
        selectedTab.active = true;
    };
    vm.navigation = [{
        alias: "detail",
        active: "true",
        hasError: "true",
        name: "Detail",
        icon: "icon-bulleted-list"
    }, {
        alias: "view",
        active: "false",
        hasError: "true",
        name: "View",
        icon: "icon-display"
    }];
    angular.element(document).ready(function () {
        $scope.metaData = [];
        inputs = document.getElementsByTagName('button');
        detailTab = $filter('filter')(inputs, { 'innerText': "Detail" })[0];
        viewTab = $filter('filter')(inputs, { 'innerText': "View" })[1];
        if (viewTab != null)
            viewTab.classList.remove("is-active");
        var actions = appState.getMenuState("menuActions");
        _.each(actions, function (action) {

            if (action.alias === "publishto") {
                vm.step = 0;
                $scope.metaData = action.metaData;
                if ($scope.metaData.length == 0) {
                    var url = $location.$$url;
                    var array = url.split('/');
                    $scope.metaData.data = array[array.length - 1];
                }
                vm.checkChilds();
            }
        });
    });
    vm.checkConnection = function () {
        $scope.server = true;
        $http({
            url: apiUrl + "HeartBeat",
            method: "GET",
        }).then(function successCallback(response) {
            $scope.success = response.data;
        }, function errorCallback(response) {

        });
    };
    vm.GetSelected = function (val) {
        if ($scope.showChild) {
            document.getElementById("urlAddress").value = "";
            vm.selectSite = "";
            vm.serverName = "";
            $scope.showChild = false;
            $scope.pubEnable = true;
        }
        else {
            document.getElementById("urlAddress").value = val.server;
            vm.selectSite = val;
            $scope.pubEnable = false;
            if ($scope.enableChild) {
                $scope.showChild = true;
            }
        }

    }
    vm.checkChilds = function () {

        $scope.enableChild = false;
        if ($scope.metaData.data == -1) {
            $scope.enableChild = true;
            vm.checkConnection();
        }
        else {
            contentResource.getById($scope.metaData.data).then(function (data) {
                contentResource.getChildren($scope.metaData.data).then(function (childs) {

                    if (childs.items != null) {
                        $scope.enableChild = true;
                    }
                    vm.checkConnection();
                });
            });
        }
    }
    vm.childSetChange = function () {
        $scope.addChild = !$scope.addChild;
        $scope.disableItem = !$scope.disableItem;
    }
    vm.includeItems = function () {
        $scope.deleteItems = !$scope.deleteItems;
    }
    vm.CollectContent = function () {
        vm.step++;
        var entrUrl = document.getElementById("urlAddress").value.trim(' ');
        
        var count = 1;

        switch (vm.step) {
            case 1:
                if ($scope.metaData != undefined) {
                    if ($scope.metaData.data == -1) {
                        contentResource.getChildren(-1).then(function (data) {

                            if (data.items == null) { $scope.allNodes = [] }
                            else $scope.allNodes = data.items;
                            contentResource.getChildren(-20).then(function (data) {
                                angular.forEach(data.items, function (node) {
                                    $scope.allNodes.push(node);
                                });

                                vm.CollectContent();
                            });
                        });
                    }
                    else {
                        contentResource.getById($scope.metaData.data).then(function (data) {
                            $scope.allNodes = [];
                            $scope.allNodes.push({ id: data.id, key: data.key });
                            contentResource.getChildren($scope.metaData.data).then(function (childs) {
                                if ($scope.addChild) {
                                    if (childs.items != null) {
                                        childs.items.map(function (t) {
                                            $scope.allNodes.push({ id: t.id, key: t.key });
                                        });
                                    }
                                }
                                vm.CollectContent();
                            });
                        });
                    }
                }
                break;
            case 2:
                $scope.server = false;
                $scope.showChild = false;
                stage1.style.display = "none";
                vm.desc = "Details of what will change";
                vm.title = "Report";
                $scope.noChange = 1;
                var countAllnodes = 0;
                $scope.nodesNeedToPublish = [];
                angular.forEach($scope.allNodes, function (selNode) {
                    $scope.report = true;
                    var dataX = {
                        'Id': selNode.key,
                        'Url': entrUrl.replace("https", "http")
                    };
                    $http({
                        url: apiUrl + "FindDifferences",
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: dataX
                    }).then(function (response3) {
                        
                        countAllnodes++;
                        if (response3.data.length != 0) {
                            $scope.difference = true;
                            $scope.changeDet = true;
                            $scope.noChange = 0;
                            $scope.nodeDifference = [];
                            $scope.nodeChanges = [];
                            $scope.myStyleObj = {
                                "margin-top": "84px",
                                "background": "#fff"
                            }
                            contentResource.getById(selNode.id).then(function (data) {

                                $scope.myText = count + " change (s) Detected";
                                $scope.mySubText = count + " item(s) was updated";
                                $scope.myIcon = response3.data[0].PropAction == "Create" ? "icon-add" : "icon-sync";
                                $scope.myIconColr = response3.data[0].PropAction == "Create" ? { "color": "green" } : { "color": "orange" };
                                var url = $location.absUrl();
                                var array = url.split("/");
                                count++;
                                angular.forEach(response3.data, function (value) {

                                    $scope.nodeDifference.push({
                                        'action': value.PropAction,
                                        'item': value.PropName,
                                        'old': value.PropOldValue,
                                        'new': value.PropCurrValue,
                                        'node': data.variants[0].name,
                                        'symb': $scope.myIcon,
                                        'symbClr': $scope.myIconColr,
                                        'localUrl': array[0] + "//" + array[2] + data.urls[0].text,
                                        'remoteUrl': entrUrl + data.urls[0].text
                                    });
                                });
                                $scope.nodesNeedToPublish.push({ nodeKey: selNode.key, action: response3.data[0].PropAction, propType: response3.data[0].PropType });
                                $scope.nodeChanges.push({
                                    'symb': $scope.myIcon,
                                    'symbClr': $scope.myIconColr,
                                    'change': response3.data[0].PropAction,
                                    'name': data.variants[0].name
                                });
                            });
                        }
                        else {

                            if ($scope.allNodes.length == countAllnodes) {
                                if ($scope.noChange == 1) {

                                    $scope.myStyleObj = {
                                        "margin-top": "84px",
                                        "background": "#c5e7d3"
                                    }
                                    $scope.noChangeView = true;
                                    $scope.myText = "No changes detected"
                                    document.getElementById("pub-Button").style.display = "none";
                                }
                            }
                        }
                    });
                });
                break;
            case 3:
                entrUrl = entrUrl.slice(0, -1);
                $scope.report = false;
                $scope.difference = false;
                $scope.changeDet = false;
                $scope.loader = true;
                vm.desc = "push to " + vm.selectSite.name;;
                vm.title = "Processing..";

                document.getElementById("pub-Button").style.display = "none";
                angular.forEach($scope.nodesNeedToPublish, function (selNode) {

                    $http({
                        url: apiUrl + "GetNode",
                        method: "GET",
                        params: { "id": selNode.nodeKey }
                    }).then(function (response1) {
                        if (selNode.action == "Update") {
                            $http({
                                url: entrUrl + apiUrl + "UpdateNode",
                                method: "PUT",
                                headers: {
                                    "Access-Control-Allow-Origin": "*",
                                    "Access-Control-Allow-Methods": "*",
                                    "Access-Control-Allow-Headers": "'Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token'",
                                },
                                data: response1.data
                            }).then(function (response2) {
                                vm.desc = ": [" + entrUrl + "/umbraco]";
                                vm.title = vm.selectSite.name + " Complete";
                                $scope.loader = false;
                                //$scope.pubComplt = true;
                                //$scope.pubText = "Publish completed"
                                $scope.myText = count + " item (s) have been updated";
                                $scope.mySubText = count + " item(s) was updated";
                                $scope.report = true;
                                $scope.changeDet = true;
                                angular.forEach($scope.nodeChanges, function (t) {
                                    t.symb = "icon-check";
                                    var ico = document.getElementById(t.name);
                                    ico.style.color = "green";
                                });
                                $scope.difference = true;
                            });
                        }
                        else if (selNode.action == "Create") {
                            $http({
                                url: entrUrl + apiUrl + "CreateNode",
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                data: response1.data
                            }).then(function (response2) {
                                vm.desc = ": [" + entrUrl + "/umbraco]";
                                vm.title = vm.selectSite.name + " Complete";
                                $scope.myText = count + " item (s) have been updated";
                                $scope.mySubText = count + " item(s) was updated";
                                $scope.report = true;
                                $scope.changeDet = true;
                                angular.forEach($scope.nodeChanges, function (t) {
                                    t.symb = "icon-check";
                                    var ico = document.getElementById(t.name);
                                    ico.style.color = "green";
                                });
                                $scope.difference = true;
                            });
                        }
                    });
                });
                break;
        }
    }
    //vm.findDifference = async function () {


    //    $http({
    //        url: apiUrl + "GetNode",
    //        method: "GET",
    //        params: { "id": selNode.key }
    //    }).then(function (response1) {
    //        var entrUrl = document.getElementById("urlAddress").value.trim(' ');
    //        entrUrl = entrUrl.slice(0, -1);
    //        $http({
    //            url: entrUrl + apiUrl + "GetNode",
    //            method: "GET",
    //            params: { "id": selNode.key }
    //        }).then(function (response2) {
    //            var dataX = {
    //                'X1': response1.data,
    //                'X2': response2.data
    //            };
    //            $http({
    //                url: apiUrl + "FindDifferences",
    //                method: "POST",
    //                headers: {
    //                    'Content-Type': 'application/json'
    //                },
    //                data: dataX
    //            }).then(function (response3) {
    //                if (response3.data.length != 0) {

    //                    $scope.nodeDifference = [];
    //                    angular.forEach(response3.data, function (value) {

    //                        $scope.nodeDifference.push({
    //                            'action': value.PropAction,
    //                            'item': "Property-" + value.PropName,
    //                            'difference': value.PropCurrValue
    //                        });
    //                    });

    //                }
    //            });
    //        });
    //    })
    //}
    vm.highlight = function (str) {
        const newdiv = document.createElement('div');
        var text = " <span class='imp'>" + str + "</span> ";
        newdiv.innerHTML = text;
        return newdiv;
    }
    vm.showDetail = async function (nodeName) {

        var detail = $scope.nodeDifference.filter(function (obj) {
            if (obj.node === nodeName) {
                return obj;
            }
        });
        //$sceDelegateProvider.resourceUrlWhitelist([
        //    // Allow same origin resource loads.
        //    "self",
        //    // Allow loading from Google maps
        //    detail.remoteUrl
        //]);

        var option = {
            data: detail,
            title: 'Create',
            view: "/App_Plugins/cSyncMaster/backoffice/syncAlias/showdiff.html",
            close: function () {
                //stage2.style.display = "block";
                editorService.close();
            }
        };
        editorService.open(option);
    }
    vm.selectNavigationItem = function (item) {

        detailTab = $filter('filter')(inputs, { 'innerText': "Detail" })[0];
        viewTab = $filter('filter')(inputs, { 'innerText': "View" })[1];
        detailTab.classList.remove("is-active");
        viewTab.classList.remove("is-active");

        if (item.name == "Detail") {
            detailTab.classList.add("is-active");
            $scope.detailTab = true;
            $scope.viewTab = false;
        }
        else {
            viewTab.classList.add("is-active");
            $scope.detailTab = false;
            $scope.viewTab = true;
        }
    }
    vm.showTable = function () {
        $scope.detail = !$scope.detail;

        $scope.expand = !$scope.expand;
    }

    $scope.trustSrc = function (src) {
        var sds = src.replace("https", "http");
        return $sce.trustAsResourceUrl(sds);
    }
});
