// Code goes here
var app = angular.module('myAPP', []);

app.component("tableComponent", {
    templateUrl: 'tableComponent.html',
    controllerAs: 'model',
    controller: ['utilityService', tableControllerFn]
});

function tableControllerFn(utilityService) {
    debugger;
    var model = this;
    model.listData = [];

    model.$onInit = function () {
        model.listData = utilityService.getTableData();
    }

    model.del = function (id) {
        var index = getSelectedIndex(id);
        if (index > -1) {
            model.listData.splice(index, 1);
        }
    };

    function getSelectedIndex(id) {
        for (var i = 0; i < model.listData.length; i++) {
            if (model.listData[i].id === id)
                return i;
        }
        return -1;
    }
}

app.service('utilityService', function () {
    this.getTableData = function () {
        return [{
            'id': 1,
            'key': 'Faizah Pratiwi',
            'name': 'Malang'
        }, {
            'id': 2,
            'key': 'Anastasya Putri',
            'name': 'Jember'
        }, {
            'id': 3,
            'key': 'Sharon Natalia',
            'name': 'Tulungagung'
        }, {
            'id': 4,
            'key': 'Faizah Pratiwi',
            'name': 'Malang'
        }]; //do intialization
    }
});
