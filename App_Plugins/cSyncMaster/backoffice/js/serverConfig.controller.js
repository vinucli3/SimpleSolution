angular.module('umbraco').controller('ServerConfigController', function ($filter, $scope, appState, contentResource, $http, umbRequestHelper, editorService, $location) {

    var vm = this;
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
});