
(function () {
    'use strict';
    angular.module("umbraco").run(function ($rootScope, eventsService, $location, contentResource, overlayService) {

        var elm = angular.element('#category-dropdown');
        eventsService.on('app.tabChange', function (evt, data) {
            update(data.content);
        });

        eventsService.on('content.loaded', function (evt, data) {
            update(data.content);
        });

        eventsService.on('content.newReady', function (evt, data) {
            update(data.content);
        });

        eventsService.on('content.saved', function (evt, data) {
            update(data.content);
        });

        function update(content) {
            insertPublishCmds(content);
        }

        function insertPublishCmds(content) {

            //if (content !== undefined) {
            //    mgr.content = content;
            
            
            //}
            

            var contentForm = angular.element(document).find('[name="contentForm"]');
            if (contentForm != null) {
                var formScope = findScope($rootScope);
                if (formScope != null) {
                    /* if (_.contains(formScope.content.allowedActions, '^')) {*/

                    if (formScope.subButtons !== null) {
                        if (!_.some(formScope.subButtons, function (b) { return b.letter == 'SYNCPUB'; })) {
                            var button = {
                                letter: 'PublishTo',
                                handler: publishToSite,
                                alias: 'PublishTo',
                                addEllipsis: 'true',
                                label: 'Publish to server',
                            };
                            formScope.subButtons.splice(1, 0, button);
                        }
                    }
                    //}
                }
            }
        }
        function findScope(scope) {


            if (!scope) return null;

            var contentScope = null;
            if (scope.subButtons !== undefined && scope.content !== undefined) {
                return scope;
            }

            if (scope.$$childHead !== null) {
                contentScope = findScope(scope.$$childHead);
            }

            if (contentScope === null && scope.$$nextSibling !== null) {
                contentScope = findScope(scope.$$nextSibling);
            }

            return contentScope;
        }
        function publishToSite(request) {
            var node = $location.$$url.split('/');
            var currnetNodeID = node[node.length - 1];

            var nodetail = contentResource.getById(currnetNodeID)
                .then(function (data) {
                   
                    var options = {
                        view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + '/cSyncMaster/overlays/puboverlay.html',
                        title: 'Select a server',
                        subtitle: 'Push document',
                        disableBackdropClick: true,
                        disableEscKey: true,
                        disableSubmitButton: true,
                        /*position:"left",*/
                        submit: function (model) {
                            // what happens when the user presses submit
                            if (model.complete) {
                                overlayService.close();
                            }
                            else {
                                model.process();
                            }
                        },
                        close: function () {
                            overlayService.close();
                        }
                    }
                    overlayService.confirm(options);
                });
          
        }

    });

})();

