angular.module('umbraco').controller("SyncDatacontroller", function ($location,
    $http, $scope, umbRequestHelper, contentResource, $filter, eventsService, appState, $rootScope, editorService) {

    var vm = this;
    vm.changeTab = changeTab;

    vm.navigation = [{
        alias: "detail",
        active: "true",
        hasError: "true",
        name: "uSync",
        icon: "icon-bulleted-list"
    },
    {
        alias: "view",
        active: "false",
        hasError: "true",
        name: "History",
        icon: "icon-display"
    },
    {
        alias: "view",
        active: "false",
        hasError: "true",
        name: "Licence",
        icon: "icon-display"
    },
    {
        alias: "view",
        active: "false",
        hasError: "true",
        name: "Settings",
        icon: "icon-display"
    }
    ];

    function changeTab(selectedTab) {
        vm.tabs.forEach(function (tab) {
            tab.active = false;
        });
        selectedTab.active = true;
    };
    angular.element(document).ready(function () {
        $(".is-active").removeClass("is-active");
        inputs = document.getElementsByTagName('button');
        uSync = $filter('filter')(inputs, { 'innerText': "uSync" })[0];
        uSync.classList.add("is-active");
    });
    eventsService.on("app.tabChange", function (event, args) {
        $(".is-active").removeClass("is-active");
        navTabs = $filter('filter')(inputs, { 'className': "umb-sub-views-nav-item_" });
        selectTab = $filter('filter')(navTabs, { 'innerText': args.name })[0];
        selectTab.classList.add("is-active");
        if (args.name == "History") {
            $scope.uSyncTab = false;
            $scope.historyTab = true;
        }
        else if(args.name == "uSync")
            $scope.uSyncTab = true;
        else
            $scope.uSyncTab = false;
       
    });

    $scope.currentPage = 1;
    $scope.numPerPage = 3;
    $scope.totalItems = 0;
    $scope.numberofPage = 0;
    $scope.gap = 5;
    $scope.everythingStatus = false;
    $scope.usersStatus = false;
    $scope.contentStatus = false;
    $scope.settingsStatus = false;
    $scope.memberStatus = false;
    $scope.uSyncTab = true;
    $scope.historyTab = true;
    //var settingsmodal = document.getElementById("settingsModel");
    //var contentsmodal = document.getElementById("contentModel");
    //var importModal = document.getElementById("impModel");
    //var userModal = document.getElementById("userModel");
    //var memberModal = document.getElementById("memberModel");
   // var modal = document.getElementById("myModal");
   // var rootNodes = [];
   // var apiUrl = umbRequestHelper.getApiUrl("publishBaseUrl", "")
    var exportApiUrl = umbRequestHelper.getApiUrl("exportBaseUrl", "");
    var importApiUrl = umbRequestHelper.getApiUrl("importBaseUrl", "");
    vm.url = document.getElementById("urlAddress");
    vm.newData = document.getElementById("newValue");
   // var msg = document.getElementById("message");
    //var msgErr = document.getElementById("messageError");
    //var span = document.getElementsByClassName("close")[0];
    //var stage1 = document.getElementById("stage1");
    //var stage2 = document.getElementById("stage2");
    //var stage2_1 = document.getElementById("stage2_1");
    //var selNode = []
    $scope.nodeChanges = [];
    $scope.exportAll = [
        "Language",
        "UserGroups",
        "Users",
        "Dictionary",
        "DataType",
        "Template",
        "DocType",
        "MediaType",
        "MemberType",
        "MemberGroups",
        "Members",
        "Macro",
        "Media",
        "Content",
        "Blueprint",
        "Domain",
        "Relation"
    ];
    vm.testModal = function () {
        //debugger;
        //settingsmodal.style.display = "block";
        //modalTest.style.display = "block";
        $scope.interfaces.push("Macro");

        //setTimeout(() => { $scope.interfaces.push("Media"); }, 1)
        //setTimeout(() => { }, 2)
    }
    //span.onclick = function () {
    //    if (modal != undefined) { modal.style.display = "none"; }
    //    importModal.style.display = "none";
    //};
    //vm.close = function () {
    //    userModal.style.display = "none";
    //    memberModal.style.display = "none";
    //    //settingsmodal.style.display = "none";
    //    contentsmodal.style.display = "none";
    //    /*importModal.style.display = "none";*/
    //    $scope.everythingStatus = false;
    //}
    vm.closeover = function () {

        editorService.close();
    }
    //$rootScope.$on("CallParentMethod", function () {
    //    vm.checkConnection();
    //});
   
    //angular.element(document).ready(function () {

    //    //$http({
    //    //    url: apiUrl + "CollectNodeDetail",
    //    //    method: "GET",

    //    //}).then(function (response) {
    //    //    vm.nodesList = response.data;
    //    //    $scope.totalItems = vm.nodesList.length;
    //    //});
    //    //debugger;
    //    //var metaData = [];
    //    //var actions = appState.getMenuState("menuActions");
    //    //_.each(actions, function (action) {
            
    //    //    if (action.alias === "publishto")
    //    //        metaData = action.metaData;
    //    //});
        
    //    //contentResource.getById(metaData.data)
    //    //    .then(function (data) {
    //    //        selNode = data;
    //    //        stage2.style.display = "none";
    //    //        vm.checkConnection();

    //    //    });
        
    //});
    //vm.selectRow = function ($event, row, rows) {
    //    //de-select all
    //    angular.forEach(rows, function (r) { r.selected = false; });
    //    //select clicked
    //    row.selected = !row.selected;
    //    flow3.selectedItem = row;
    //    document.getElementById("selectNode").value = row.key;
    //}
    $scope.prevPage = function () {
        
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
        }
    };
    $scope.nextPage = function () {
        
        var rem = $scope.totalItems / $scope.numPerPage;

        if ($scope.currentPage < rem) {
            $scope.currentPage++;
        }
    };
    $scope.setPage = function (n) {
        $scope.currentPage = n;
    };
    $scope.paginate = function (value) {
        var begin, end, index;
        begin = ($scope.currentPage - 1) * $scope.numPerPage;
        $scope.numberofPage = Math.round($scope.totalItems / $scope.numPerPage);
        end = begin + $scope.numPerPage;
        index = vm.nodesList.indexOf(value);
        return (begin <= index && index < end);
    };

    /********Export Import work******** */
    vm.settingImport = async function setting() {
       
        $scope.interfaces = [];
        $scope.settingsStatus = true;
       
       // settingsmodal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(function (response) { return response; }).catch(error => { alert("No connection " + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("Macro");
            resp = await $http.get(importApiUrl + 'ImportMacro').then(x => { return x; }).catch(error => { alert(error + "ImportMacro"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Language");
                resp = await $http.get(importApiUrl + 'ImportLanguage').then(x => { return x; }).catch(error => { alert(error + "ImportLanguage"); });
                if (resp.status == 200) {
                    $scope.interfaces.push("DataType");
                    resp = await $http.get(importApiUrl + 'ImportDataType').then(x => { return x; }).catch(error => { alert(error + "ImportDataType"); });
                    if (resp.status == 200) {
                        $scope.interfaces.push("Template");
                        resp = await $http.get(importApiUrl + 'ImportTemplate').then(x => { return x; }).catch(error => { alert(error + "ImportTemplate"); });
                        if (resp.status == 200) {
                            $scope.interfaces.push("DocType");
                            resp = await $http.get(importApiUrl + 'ImportDocType').then(x => { return x; }).catch(error => { alert(error + "ImportDocType"); });
                            if (resp.status == 200) {
                                $scope.interfaces.push("MediaType");
                                resp = await $http.get(importApiUrl + 'ImportMediaType').then(x => { return x; }).catch(error => { alert(error + "ImportMediaType"); });
                                if (resp.status == 200) {
                                    $scope.interfaces.push("MemberType");
                                    resp = await $http.get(importApiUrl + 'ImportMemberType').then(x => { return x; }).catch(error => { alert(error + "ImportMemberType"); });
                                    if (resp.status == 200) {
                                        setTimeout(() => { alert("Import complete");  $scope.interfaces = []; }, 2)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    vm.settingExport = async function setting() {
        
        $scope.interfaces = [];
        $scope.settingsStatus = true;
        //settingsmodal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(function (response) { return response; }).catch(error => { alert("No connection " + error); });
        if (resp.status == 200) {
            resp = await $http.get(exportApiUrl + 'ExportLanguage').then(x => { return x; }).catch(error => { alert(error + "ExportLanguage"); });
            $scope.interfaces.push("Language");
            if (resp.status == 200) {
                resp = await $http.get(exportApiUrl + 'ExportDataType').then(x => { return x; }).catch(error => { alert(error + "ExportDataType"); });
                $scope.interfaces.push("DataType");
                if (resp.status == 200) {
                    resp = await $http.get(exportApiUrl + 'ExportTemplate').then(x => { return x; }).catch(error => { alert(error + "ExportTemplate"); });
                    $scope.interfaces.push("Template");
                    if (resp.status == 200) {
                        resp = await $http.get(exportApiUrl + 'ExportDocType').then(x => { return x; }).catch(error => { alert(error + "ExportDocType"); });
                        $scope.interfaces.push("DocType");
                        if (resp.status == 200) {
                            resp = await $http.get(exportApiUrl + 'ExportMediaType').then(x => { return x; }).catch(error => { alert(error + "ExportMediaType"); });
                            $scope.interfaces.push("MediaType");
                            if (resp.status == 200) {
                                resp = await $http.get(exportApiUrl + 'ExportMemberType').then(x => { return x; }).catch(error => { alert(error + "ExportMemberType"); });
                                $scope.interfaces.push("MemberType");
                                if (resp.status == 200) {
                                    resp = await $http.get(exportApiUrl + 'ExportMacro').then(x => { return x; }).catch(error => { alert(error + "ExportMacro"); });
                                    $scope.interfaces.push("Macro");
                                    if (resp.status == 200) {
                                        setTimeout(() => { /*settingsmodal.style.display = "none";*/ $scope.interfaces = []; alert("Export Completed"); }, 2);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    vm.contentImport = async function content() {
        $scope.interfaces = [];
        $scope.contentStatus = true;
        //contentsmodal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(function (response) { return response; }).catch(error => { alert("No connection " + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("Dictionary");
            resp = await $http.get(importApiUrl + 'ImportDictionary').then(x => { return x; }).catch(error => { alert(error + "ImportDictionary"); });
            if (resp.status == 200) {
            } $scope.interfaces.push("Media");
            resp = await $http.get(importApiUrl + 'ImportMedia').then(x => { return x; }).catch(error => { alert(error + "ImportMedia"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Content");
                resp = await $http.get(importApiUrl + 'ImportContent').then(x => { return x; }).catch(error => { alert(error + "ImportContent"); });
                if (resp.status == 200) {
                    $scope.interfaces.push("Blueprint");
                    resp = await $http.get(importApiUrl + 'ImportBlueprint').then(x => { return x; }).catch(error => { alert(error + "ImportBlueprint"); });
                    if (resp.status == 200) {
                        $scope.interfaces.push("Domain");
                        resp = await $http.get(importApiUrl + 'ImportDomain').then(x => { return x; }).catch(error => { alert(error + "ImportDomain"); });
                        if (resp.status == 200) {
                            $scope.interfaces.push("Relation");
                            resp = await $http.get(importApiUrl + 'ImportRelation').then(x => { return x; }).catch(error => { alert(error + "ImportRelation"); });
                            if (resp.status == 200) {
                                setTimeout(() => { /*contentsmodal.style.display = "none";*/ $scope.interfaces = []; alert("Import complete"); }, 2)
                            }
                        }
                    }
                }
            }
        }
    }
    vm.contentExport = async function content() {
        $scope.interfaces = [];
        $scope.contentStatus = true;
        //contentsmodal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(function (response) { return response; }).catch(error => { alert("No connection " + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("Dictionary");
            resp = await $http.get(exportApiUrl + 'ExportDictionary').then(x => { return x; }).catch(error => { alert(error + "ExportDictionary"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Media");
                resp = await $http.get(exportApiUrl + 'ExportMedia').then(x => { return x; }).catch(error => { alert(error + "ExportMedia"); });
                if (resp.status == 200) {
                    $scope.interfaces.push("Content");
                    resp = await $http.get(exportApiUrl + 'ExportContent').then(x => { return x; }).catch(error => { alert(error + "ExportContent"); });
                    if (resp.status == 200) {
                        $scope.interfaces.push("Blueprint");
                        resp = await $http.get(exportApiUrl + 'ExportBlueprint').then(x => { return x; }).catch(error => { alert(error + "ExportBlueprint"); });
                        if (resp.status == 200) {
                            $scope.interfaces.push("Domain");
                            resp = await $http.get(exportApiUrl + 'ExportDomain').then(x => { return x; }).catch(error => { alert(error + "ExportDomain"); });
                            if (resp.status == 200) {
                                $scope.interfaces.push("Relation");
                                resp = await $http.get(exportApiUrl + 'ExportRelation').then(x => { return x; }).catch(error => { alert(error + "ExportRelation"); });
                                if (resp.status == 200) {
                                    setTimeout(() => { /*contentsmodal.style.display = "none";*/ $scope.interfaces = []; alert("Export Completed"); }, 2);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    vm.export = async function exportItems() {
        $scope.interfaces = [];
        $scope.everythingStatus = true;

        var resp = await $http.get(exportApiUrl + 'HeartBeat').then(x => { return x; }).catch(error => { alert("Export erorr" + error); });
        if (resp.status == 200) {
            angular.forEach($scope.exportAll, async function (item) {
                $scope.interfaces.push(item);
                resp = await $http.get(exportApiUrl+"Export" + item).then(x => { return x; }).catch(error => { alert(error + item); });
            });
        }
    }
    vm.import = async function importItems() {
        $scope.interfaces = [];
        everythingStatus.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(function (response) { return response; }).catch(error => { alert("No connection " + error); });
        if (resp.status == 200) {
            angular.forEach($scope.exportAll, async function (item) {
                $scope.interfaces.push(item);
                resp = await $http.get(exportApiUrl + "Import" + item).then(x => { return x; }).catch(error => { alert(error + item); });
            });
        }
    }
    vm.usersexport = async function exportUsers() {
        $scope.interfaces = [];
        $scope.usersStatus = true;
        //userModal.style.display = "block";
        var resp = await $http.get(exportApiUrl + 'HeartBeat').then(x => { return x; }).catch(error => { alert("Export erorr" + error); });
        ;
        if (resp.status == 200) {
            $scope.interfaces.push("UserGroups");
            var resp = await $http.get(exportApiUrl + 'ExportUserGroups').then(x => { return x; }).catch(error => { alert(error + "ExportUserGroups"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Users");
                var resp = await $http.get(exportApiUrl + 'ExportUsers').then(x => { return x; }).catch(error => { alert(error + "ExportUsers"); });
                if (resp.status == 200) {
                    setTimeout(() => { /*userModal.style.display = "none";*/ $scope.interfaces = []; alert("Import complete"); }, 2)
                }
            }
        }

    }
    vm.usersimport = async function importUsers() {
        $scope.interfaces = [];
        $scope.usersStatus = true;
        //userModal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(x => { return x; }).catch(error => { alert("Import error" + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("UserGroups");
            var resp = await $http.get(importApiUrl + 'ImportUserGroups').then(x => { return x; }).catch(error => { alert(error + "ImportUserGroups"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Users");
                var resp = await $http.get(importApiUrl + 'ImportUsers').then(x => { return x; }).catch(error => { alert(error + "ImportUsers"); });
                if (resp.status == 200) { setTimeout(() => { /*userModal.style.display = "none";*/ $scope.interfaces = []; alert("Import complete"); }, 2) }
            }
        }
    }
    vm.membersimport = async function importMembers() {
        $scope.interfaces = [];
        $scope.memberStatus = true;
        //memberModal.style.display = "block";
        var resp = await $http.get(importApiUrl + 'HeartBeat').then(x => { return x; }).catch(error => { alert("Import error" + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("MemberGroups");
            var resp = await $http.get(importApiUrl + 'ImportMemberGroups').then(x => { return x; }).catch(error => { alert(error + "ImportMemberGroups"); });;
            if (resp.status == 200) {
                $scope.interfaces.push("Member");
                var resp = await $http.get(importApiUrl + 'ImportMembers').then(x => { return x; }).catch(error => { alert(error + "ImportMembers"); });;
                if (resp.status == 200) {
                    setTimeout(() => { /*memberModal.style.display = "none";*/ $scope.interfaces = []; alert("Import complete"); }, 2)
                }
            }
        }
    }
    vm.membersexport = async function exportMembers() {
        $scope.interfaces = [];
        $scope.memberStatus = true;
        //memberModal.style.display = "block";
        var resp = await $http.get(exportApiUrl + 'HeartBeat').then(x => { return x; }).catch(error => { alert("Export erorr" + error); });
        if (resp.status == 200) {
            $scope.interfaces.push("MemberGroup");
            var resp = await $http.get(exportApiUrl + 'ExportMemberGroups').then(x => { return x; }).catch(error => { alert(error + "ExportMemberGroups"); });
            if (resp.status == 200) {
                $scope.interfaces.push("Member");
                var resp = await $http.get(exportApiUrl + 'ExportMembers').then(x => { return x; }).catch(error => { alert(error + "ExportMembers"); });
                if (resp.status == 200) {
                    setTimeout(() => { /*memberModal.style.display = "none";*/ $scope.interfaces = []; alert("Import complete"); }, 2)
                }
            }
        }
    }

    /****************Publish************* */
    //vm.addText = function () {

    //    //// Get the input value
    //    var inputValue = document.getElementById("textInput").value;

    //    // Check if the input is not empty
    //    if (inputValue.trim() !== "") {
    //        // Create a new list item
    //        var listItem = document.createElement("li");
    //        // Set the text content of the list item
    //        listItem.textContent = inputValue;
    //        // Append the new list item to the textList
    //        document.getElementById("textList").appendChild(listItem);
    //        // Clear the input field
    //        document.getElementById("textInput").value = "";
    //    }
    //};
    //vm.GetSelected = function (val) {
    //    //debugger;
    //    //var grid = document.getElementById("ServerTable");
    //    //var checkBoxes = grid.getElementsByTagName("INPUT");
    //    //for (var i = 0; i < checkBoxes.length; i++) {
    //    //    if (checkBoxes[i].checked) {
    //    //        var row = checkBoxes[i].parentNode.parentNode;
    //            document.getElementById("urlAddress").value = val;
    //    //    }
    //    //}
    //}
    //vm.GetSelectedNode = function () {

    //    var grid = document.getElementById("NodeTable");
    //    var checkBoxes = grid.getElementsByTagName("INPUT");
    //    var ds = vm.nodesList.Any(x => x.Selected == true);
    //    debugger;
    //    for (var i = 0; i < checkBoxes.length; i++) {
    //        if (checkBoxes[i].checked) {
    //            var row = checkBoxes[i].parentNode.parentNode;
    //            document.getElementById("selectNode").value = row.cells[1].innerText;
    //        }
    //    }
    //}
    //vm.checkConnection = function () {
    //    debugger;
    //    //var mainDiv = document.getElementById("contextdialog-title");
    //    //var el = document.createElement("h6");
    //    //el.textContent = "Push document to Prod";
    //    //el.style.marginTop = "-7px"
    //    //mainDiv.textContent = 'Select a server';
    //    //mainDiv.appendChild(el);
    //    var result = selNode.key;

    //    $http({
    //        url: "/umbraco/Publish/PublishServerConfig/All",
    //        method: "GET"
    //    }).then(function (x) {
    //        var listItems = [];
    //        x.data.forEach(function (item) {

    //            // Set the text content of the list item
    //            listItems.push({
    //                'url': item.url,
    //                'name': item.name
    //            });
    //            // Append the new list item to the textList
    //        });
          
    //        vm.success = [];
    //        if (listItems.length != 0) {
    //            listItems.forEach(function (item) {
    //                var uslTest = item.url.slice(0, -1);
    //                $http({
    //                    url: uslTest + apiUrl + "HeartBeat",
    //                    method: "GET",
    //                }).then(function (response) {
    //                    if (response.data == 1) {
    //                        vm.success.push({
    //                            Server: item.url,
    //                            Status: "0",
    //                            name:item.name
    //                        });
    //                    }
    //                }).catch(error => {
    //                    console.error('Error:', error);
    //                    vm.success.push({
    //                        Server: item.url,
    //                        Status: "1",
    //                        name: item.name
    //                    });
    //                });
    //            });
               
    //            //modal.style.display = "block";
    //        }
    //    });
    //};
    //vm.exportData = function () {
    //    $http({
    //        url: "/Umbraco/CreateContent/ContentData/index",
    //        method: "GET",
    //        dataType: "json",
    //    }).then(function (response) {
    //        vm.alldata = response.data;
    //    }).catch(error => {
    //        msgErr.style.display = "block";
    //    });
    //};
    //vm.importData = function () {
    //    $http({
    //        url: "/Umbraco/ClaySync/CustomPublisherApi/importData",
    //        method: "POST",
    //        headers: {
    //            'Content-Type': 'application/json'
    //        },
    //        data: JSON.stringify(Data)
    //    }).then(function (response) {
    //        $scope.users = response.data.data;
    //    }).catch(error => {
    //        msgErr.style.display = "block";
    //    });
    //};
    //vm.upDateValue = function () {

    //    var result = selNode.key;

    //    contentResource.getById(result)
    //        .then(function (data) {

    //            var prop = $filter('filter')(data.variants[0].tabs[0].properties, { 'label': 'Title' });
    //            $scope.prop = {
    //                'Key': data.key,
    //                'Value': prop[0].value
    //            }
    //            debugger;
    //            var entrUrl = document.getElementById("urlAddress").value.trim(' ');
    //            entrUrl = entrUrl.slice(0, -1);
    //            var url = entrUrl + apiUrl + 'UpdateContent';

    //            $http({
    //                url: url,
    //                method: "POST",
    //                headers: {
    //                    'Content-Type': 'application/json'
    //                },
    //                data: JSON.stringify($scope.prop)
    //            }).then(function (response) {
    //                msg.style.display = "block";
    //            }).catch(error => {
    //                msgErr.style.display = "block";
    //            });
    //        });

    //};
    //vm.upDateImage = function () {
    //    $http({
    //        url: apiUrl + "ImageProcess",
    //        method: "GET",
    //        params: { "id": selNode.key }
    //    }).then(function (response) {
    //        debugger;
    //        vm.imageData = response.data;
    //        var entrUrl = document.getElementById("urlAddress").value.trim(' ');
    //        entrUrl = entrUrl.slice(0, -1);
    //        $http({
    //            url: entrUrl + apiUrl + "ImageUpdate",
    //            method: "POST",
    //            headers: {
    //                'Content-Type': 'application/json'
    //            },
    //            data: vm.imageData
    //        }).then(function (response) {
    //            debugger;
    //            msg.style.display = "block";
    //            setTimeout(() => { modal.style.display = "none"; }, 2000)
    //        },
    //            function (response) {
    //                debugger;
    //                console.debug("error - saved comment", $scope.comment);
    //            }).error(function (data, status, headers, config) {
    //                debugger;
    //                console.debug("saved comment", $scope.comment);
    //            }).catch(error => {
    //                debugger;
    //                msgErr.style.display = "block";
    //                msgErr.value = error;
    //            });

    //    });

    //};
    //vm.contentDifference = function () {
        
    //    debugger;
    //    //modal.style.display = "block";
    //    stage1.style.display = "none";
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
    //            if (response2.data == "New Node") {
    //                $scope.myText = "Change (s) Detected";// response3.data
    //                $scope.nodeChanges = [];
    //                $scope.nodeChanges.push({
    //                    'symb': "icon-sync",
    //                    'change': "Change",
    //                    'name': selNode.variants[0].name
    //                });
    //            }
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
    //                    $scope.myText = "Change (s) Detected";// response3.data
    //                    debugger;
    //                    $scope.nodeChanges = [];
    //                    $scope.nodeChanges.push({
    //                        'symb': "icon-sync",
    //                        'change': "Change",
    //                        'name': selNode.variants[0].name
    //                    });
    //                    stage2_1.style.display = "block";
    //                }
    //                else {
    //                    $scope.myText = "No changes detected"
    //                    document.getElementById("pub-Button").style.display = "none";
    //                    stage2_1.style.display = "none";
    //                }
    //                stage2.style.display = "block";
    //            });

    //        });

    //    })
    //};

});

