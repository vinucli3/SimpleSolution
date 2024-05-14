

(function () {
    'use strict';
    var myApp = angular.module('umbraco');
    myApp.factory('PublishDatacontroller', function dialogManager(editorService, navigationService) {
       
        return {
            openCreateDialog: openCreateDialog,
        };

        function openCreateDialog(options, cb) {
            var option = {
                entity: {
                    id: options.entity.id * 1,
                    name: options.entity.name
                },
                languages: options.languages,
                title: 'Create',
                view: "/App_Plugins/cSyncMaster/backoffice/syncAlias/publishto.html",
                size: 'small',
                close: function () {
                    editorService.close();
                    navigationService.hideNavigation();
                    if (cb !== undefined) {
                        cb(false);
                    }
                }
            };
            editorService.open(option);

        };
    });
   

}) ();




