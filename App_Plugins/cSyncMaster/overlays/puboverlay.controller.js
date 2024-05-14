(function () {
    'use strict';

    function customOverlayController($scope, $http, umbRequestHelper, $location, editorService, overlayService, contentResource) {

        $scope.sapstage1 = true;
        $scope.sapstage2 = false;
        $scope.sapstage3 = false;
        $scope.sapstage3_1 = false;
        $scope.sapstage3_2 = false;
        $scope.addChildOver = true;
        $scope.disableItem = false;
        $scope.deleteItems = true;
        $scope.loader = false;
        $scope.viewChange = false;
        $scope.sapstage2_0 = false;
        $scope.sapstage2_1 = false;
        $scope.sapstage3_2 = true;

        $scope.nodesNeedToPublish = [];
        ; var vm = this;
        $scope.model.complete = false;
        $scope.allNodes = [];
        vm.step = 1;
        var apiUrl = umbRequestHelper.getApiUrl("publishBaseUrl", "")
        vm.icon = 'icon-box';
        var selNode;
        vm.content = 'A custom overlay.'
        $scope.nodeChanges = [];
        var buttonName = document.getElementsByClassName("btn umb-button__button btn-success umb-button-- umb-outline");
        buttonName[1].textContent = "Continue";
        // add method to model, so we can call it from parent 
        $scope.model.process = process;
        var selectServer = [];

        $scope.expand = 'Hide';

        vm.$onInit = function () {
            var url = $location.$$url;
            var array = url.split('/');
            $scope.nodeId = array[array.length - 1];
            vm.checkConnection();
        }

        function process() {
            vm.step++;
            $scope.model.description = 'Step ' + vm.step;

            switch (vm.step) {
                case 2:
                    $scope.model.title = 'Publish to ' + selectServer.name;
                    $scope.model.subtitle = selectServer.Server;
                    contentResource.getChildren($scope.nodeId).then(function (childs) {
                        $scope.sapstage1 = false;
                        $scope.sapstage3 = false;
                        $scope.sapstage2 = true;

                        if (childs.items != null) {
                            $scope.model.title = 'Publish to ' + selectServer.name;
                            $scope.model.subtitle = selectServer.Server;
                            buttonName[1].textContent = 'Continue';
                            $scope.sapstage2_0 = true;
                        }
                        else {
                            $scope.sapstage2_1 = true;
                        }
                    });
                    break;
                case 3:
                    $scope.sapstage2_1 = false;
                    contentResource.getById($scope.nodeId).then(function (data) {
                        $scope.allNodes = [];
                        $scope.allNodes.push({ id: data.id, key: data.key });
                        contentResource.getChildren($scope.nodeId).then(function (childs) {
                            if ($scope.addChildOver) {
                                if (childs.items != null) {
                                    childs.items.map(function (t) {
                                        $scope.allNodes.push({ id: t.id, key: t.key });
                                    });
                                }
                            }

                            vm.findDifference();
                        });
                    });

                    break;
                case 4:
                    $scope.sapstage1 = false;
                    $scope.sapstage2 = false;
                    $scope.sapstage3 = false;
                    $scope.loader = true;
                    var entrUrl = document.getElementById("urlAddress").value.trim(' ');
                    entrUrl = entrUrl.slice(0, -1);
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
                                    if ($scope.deleteItems) {



                                    }
                                    else {
                                        $scope.model.title = selectServer.name + ' Complete';
                                        $scope.model.subtitle = ':[' + selectServer.Server + ']';
                                        $scope.loader = false;
                                        vm.icon = 'icon-check color-green';
                                        vm.content = 'We are done now';
                                        buttonName[1].textContent = 'Done';
                                        $scope.model.complete = true;
                                        $scope.myIconColr = { "color": "green" }
                                        angular.forEach($scope.nodeChanges, function (t) {
                                            t.symb = "icon-check";
                                            var ico = document.getElementById(t.name);
                                            ico.style.color = "green";
                                        });
                                        $scope.sapstage3 = true;
                                    }
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
                                    if ($scope.deleteItems) {

                                    }
                                    else {
                                        $scope.model.title = selectServer.name + ' Complete';
                                        $scope.model.subtitle = ':[' + selectServer.Server + ']';
                                        $scope.loader = false;
                                        vm.icon = 'icon-check color-green';
                                        vm.content = 'We are done now';
                                        buttonName[1].textContent = 'Done';
                                        $scope.model.complete = true;
                                        angular.forEach($scope.nodeChanges, function (t) {
                                            t.symb = "icon-check";
                                            var ico = document.getElementById(t.name);
                                            ico.style.color = "green";
                                        });
                                        $scope.sapstage3 = true;
                                    }

                                });
                            }
                        });
                    });
                    break;
            }
        }

        vm.checkConnection = function () {
            $http({
                url: "/umbraco/Publish/PublishServerConfig/All",
                method: "GET"
            }).then(function (x) {
                $scope.listItems = [];
                x.data.forEach(function (item) {
                    $scope.listItems.push({
                        'url': item.url,
                        'name': item.name
                    });
                });

                vm.success = [];
                if ($scope.listItems.length != 0) {
                    $scope.listItems.forEach(function (item) {
                        var url = item.url.replace('https', 'http');
                        $http({
                            url: apiUrl + "HeartBeat",
                            method: "GET",
                            params: { "url": url }
                        }).then(function (response) {
                            if (response.data == 200) {
                                vm.success.push({
                                    Server: item.url,
                                    Status: "0",
                                    name: item.name,
                                    cursor: "pointer",
                                    style: {
                                        "color": "green",
                                        "font-size": "45px",
                                        "margin": "auto",
                                    }
                                });
                            }
                            else {
                                vm.success.push({
                                    Server: item.url,
                                    Status: "1",
                                    name: item.name,
                                    cursor: "not-allowed",
                                    style: {
                                        "color": "red",
                                        "font-size": "45px",
                                        "margin": "auto",
                                    }
                                });
                            }

                        }).catch(error => {

                        });
                    });
                }
            });
        };
        vm.GetSelected = function (val) {
            document.getElementById("urlAddress").value = val.Server;
            selectServer = val;
            $scope.model.disableSubmitButton = false;
            process();
        }
        vm.showTable = function () {

            if ($scope.sapstage3_2) {
                $scope.sapstage3_2 = false;
                $scope.expand = "Expand";
            }
            else {
                $scope.sapstage3_2 = true;
                $scope.expand = "Hide";
            }

        }
        vm.childSetChange = function () {
            $scope.disableItem = !$scope.disableItem;
            if ($scope.disableItem) {
                $scope.deleteItems = false;
            };
        }
        vm.includeItems = function () {
            $scope.deleteItems = !$scope.deleteItems;
        }
        vm.findDifference = async function () {
            var countAllnodes = 0;
            $scope.noChange = 1;
            var count = 1;
            $scope.noChange = 1;
            var countAllnodes = 0;
            var entrUrl = document.getElementById("urlAddress").value.trim(' ');
            entrUrl = entrUrl.slice(0, -1);
            angular.forEach($scope.allNodes, function (selNode) {
                $http({
                    url: apiUrl + "GetNode",
                    method: "GET",
                    params: { "id": selNode.key }
                }).then(function (response1) {
                    debugger;
                    $http({
                        url: entrUrl + apiUrl + "GetNode",
                        method: "GET",
                        params: { "id": selNode.key }
                    }).then(function (response2) {
                        $scope.report = true;

                        if (response2.data == "New Node") {
                            response2.data = { "Content": "" };
                        }
                        var dataX = {
                            'X1': response1.data,
                            'X2': response2.data
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
                                    $scope.model.title = 'Report';
                                    $scope.model.subtitle = 'Details of what will change';
                                    $scope.sapstage1 = false;
                                    $scope.sapstage2 = false;
                                    $scope.sapstage3 = true;
                                });
                            }
                            else {

                                if ($scope.allNodes.length == countAllnodes) {
                                    if ($scope.noChange == 1) {
                                        $scope.model.title = 'Report';
                                        $scope.model.subtitle = 'Details of what will change';
                                        $scope.sapstage1 = false;
                                        $scope.sapstage2 = false;
                                        $scope.sapstage3 = false;
                                        $scope.viewChange = true;
                                        buttonName[1].outerHTML = '';
                                        $scope.model.complete = true;
                                    }
                                }
                            }
                            //stage2.style.display = "block";
                        });
                    });
                });

            });
        }
        vm.showDetail = async function (nodeName) {

            var detail = $scope.nodeDifference.filter(function (obj) {
                if (obj.node === nodeName) {
                    return obj;
                }
            });

            var option = {
                data: detail,
                title: 'Create',
                view: "/App_Plugins/cSyncMaster/backoffice/syncAlias/showdiff.html",
                size: "small",
                close: function () {
                    editorService.close();
                }
            };
            editorService.open(option);


        }
    }

    angular.module('umbraco')
        .controller('pubOverlayController', customOverlayController);
})();