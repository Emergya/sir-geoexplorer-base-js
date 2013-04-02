/**
 * Copyright (c) 2008-2011 The Open Planning Project
 *
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = RemoveLayer
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("PersistenceGeo.tree");

/** api: constructor
 *  .. class:: RemoveLayer(config)
 *
 *    Plugin for removing a selected layer from the map.
 *    TODO Make this plural - selected layers
 */
PersistenceGeo.tree.RemoveLayer = Ext.extend(gxp.plugins.RemoveLayer, {

    /** api: ptype = pgeo_removelayer */
    ptype: "pgeo_removelayer",

    /** api: method[addActions]
     */
    addActions: function() {       
        var actions = gxp.plugins.RemoveLayer.superclass.addActions.apply(this, [{
            menuText: this.removeMenuText,
            iconCls: "gxp-icon-removelayers",
            disabled: true,
            tooltip: this.removeActionTip,
            handler: this._removalHandler,
            scope: this
        }]);
        var removeLayerAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            this._selectedLayer = record;
            var canDelete = true;
            if (record) {
                var layer = record.getLayer();

                // We cannot remove the layers marked as not removable.
                var removable = layer.metadata && !!layer.metadata.removable;
                // Nor initial layers.
                var initialLayer = typeof(layer.authId) == "undefined" && typeof(layer.layerID) == "undefined";
                cannotDelete = !removable && initialLayer;
            }
            removeLayerAction.setDisabled(cannotDelete);
        }, this);
        var enforceOne = function(store) {
            removeLayerAction.setDisabled(!this._selectedLayer || store.getCount() <= 1);
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });

        return actions;
    },

    _removalHandler: function() {
        var record = this._selectedLayer;

        if (!record) {
            return;
        }

        
        var layer = record.getLayer();
        var userInfo = app.persistenceGeoContext.userInfo;
       
        // We only delete from the server if the layer is persisted (has layerID), the user is logged
        // (userInfo exists) and the user can delete the layer (because is admin and layer is public or the layer's is
        // owned by the user's authority.)            
        if ( !! layer.layerID && userInfo && userInfo.authorityId  
            && (userInfo.admin && layer.authId === null || userInfo.authorityId == layer.authId)) { 


            // We confirm the deletion.
            Ext.Msg.show({
                title: '',
                msg: 'La capa se eliminará permanentemente del servidor.<br><br>¿Realmente desea borrar la capa?',
                buttons: Ext.Msg.YESNO,
                animEl: 'elId',
                width: 350,
                buttons:{
                    yes: "Borrar capa",
                    no: "No borrar capa"
                },
                fn: function(result) {
                    if (result == 'yes') {

                        app.persistenceGeoContext.removeLayer(layer);
                        this._doLayerRemoval(record);
                    }
                },
                icon: Ext.MessageBox.QUESTION,
                scope: this
            });

        } else {
            this._doLayerRemoval(record);
        }
    },

    _doLayerRemoval: function(record) {
        var layer = record.getLayer();
        if (layer.metadata && layer.metadata.labelLayer) {
            // Label Layer
            var editiontbar = Ext.getCmp("editiontbar");
            var addtagtomaptool = editiontbar.getPlugin("addtagtomap");
            var controlfromtool = null;
            if (addtagtomaptool.getActionFromTool() != null) {
                controlfromtool = addtagtomaptool.getActionFromTool().control;
            }
            if (editiontbar != null && addtagtomaptool != null && controlfromtool != null) {
                if (controlfromtool.active) {
                    controlfromtool.deactivate();
                    var controlsFromMap = Viewer.getMapPanel().map.controls;
                    for (var i = 0; i < controlsFromMap.length; i++) {
                        if (controlsFromMap[i].handlerOptions && controlsFromMap[i].handlerOptions.scope && controlsFromMap[i].handlerOptions.scope.id == controlfromtool.handlerOptions.scope.id) {
                            controlsFromMap[i].activate();
                            controlsFromMap[i].deactivate();
                        }
                    }
                }

                addtagtomaptool.layerRemoved = true;
            }
        }

        this.target.mapPanel.layers.remove(record);
    }

});

Ext.preg(PersistenceGeo.tree.RemoveLayer.prototype.ptype, PersistenceGeo.tree.RemoveLayer);