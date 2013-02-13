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
        var selectedLayer;
        var actions = gxp.plugins.RemoveLayer.superclass.addActions.apply(this, [{
            menuText: this.removeMenuText,
            iconCls: "gxp-icon-removelayers",
            disabled: true,
            tooltip: this.removeActionTip,
            handler: function() {
                var record = selectedLayer;

                if(record) {
                    if(this.target.isAuthorized() 
                        && !!record.getLayer().layerID
                        && !!record.getLayer().groupLayersIndex
                        && this.target.isAuthorizedIn(record.getLayer().groupLayersIndex())){
                        this.target.persistenceGeoContext.removeLayer(record.getLayer());
                    }
                    if(record.getLayer().metadata && record.getLayer().metadata.labelLayer){
                        // Label Layer
                        var editiontbar = Ext.getCmp("editiontbar");
                        var addtagtomaptool = editiontbar.getPlugin("addtagtomap");
                        var controlfromtool = null;
                        if(addtagtomaptool.getActionFromTool() != null){
                            controlfromtool = addtagtomaptool.getActionFromTool().control;
                        }
                        if(editiontbar != null && addtagtomaptool != null && controlfromtool != null){
                            if(controlfromtool.active){
                                controlfromtool.deactivate();
                                var controlsFromMap = Viewer.getMapPanel().map.controls;
                                for(var i=0; i<controlsFromMap.length; i++){
                                    if(controlsFromMap[i].handlerOptions 
                                        && controlsFromMap[i].handlerOptions.scope
                                        && controlsFromMap[i].handlerOptions.scope.id == controlfromtool.handlerOptions.scope.id){
                                        controlsFromMap[i].activate();
                                        controlsFromMap[i].deactivate();
                                    }
                                }
                            }
                            this.target.mapPanel.layers.remove(record);
                            addtagtomaptool.layerRemoved = true;
                        }
                    }else{
                        this.target.mapPanel.layers.remove(record);
                    }
                }
            },
            scope: this
        }]);
        var removeLayerAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            selectedLayer = record;
            removeLayerAction.setDisabled(
                this.target.mapPanel.layers.getCount() <= 1 || !record
            );
        }, this);
        var enforceOne = function(store) {
            removeLayerAction.setDisabled(
                !selectedLayer || store.getCount() <= 1
            );
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });
        
        return actions;
    }
        
});

Ext.preg(PersistenceGeo.tree.RemoveLayer.prototype.ptype, PersistenceGeo.tree.RemoveLayer);
