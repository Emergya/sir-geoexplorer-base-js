/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/QueryForm.js
 */

/** api: (define)
 *  module = Viewer.widgets
 *  class = QueryForm
 */

/** api: (extends)
 *  plugins/QueryForm.js
 */
Ext.namespace("Viewer.widgets");

/** api: constructor
 *  .. class:: QueryForm(config)
 *
 *    Plugin for performing queries on feature layers
 *    TODO Replace this tool with something that is less like GeoEditor and
 *    more like filtering.
 */
Viewer.widgets.QueryForm = Ext.extend(gxp.plugins.QueryForm, {
    
    /** api: ptype = vw_queryform */
    ptype: "vw_queryform",

    /** api: showMenuText 
     * Defaults false.
     */
    showMenuText: false,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        Ext.apply(this, config);
        gxp.plugins.QueryForm.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.QueryForm.superclass.init.apply(this, arguments);
        target.on('beforerender', this.addActions, this);
    },
    
    /** api: method[addActions]
     */
    addActions: function(actions) {
        if (!this.initialConfig.actions 
            // && !actions
            ) {
            actions = [{
                text: this.showMenuText ? this.queryActionText: '',
                menuText: this.showMenuText ? this.queryMenuText : '',
                iconCls: "vw_queryform",
                tooltip: this.queryActionTip,
                disabled: true,
                toggleGroup: this.toggleGroup,
                enableToggle: true,
                allowDepress: true,
                toggleHandler: function(button, pressed) {
                    if (this.autoExpand && this.output.length > 0) {
                        var expandContainer = Ext.getCmp(this.autoExpand);
                        expandContainer[pressed ? 'expand' : 'collapse']();
                        if (pressed) {
                            expandContainer.expand();
                            if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                                expandContainer.ownerCt.expand();
                            }
                        } else {
                            this.target.tools[this.featureManager].loadFeatures();
                        }
                    }
                },
                scope: this
            }];
        }
        if(!this.target.tools[this.featureManager]
            && !!this.target.target
            && !!this.target.target.tools[this.featureManager]){
            var tmpTarget = this.target;
            this.target = this.target.target;
            this.actions = gxp.plugins.QueryForm.superclass.addActions.apply(this, actions);
            // support custom actions
            if (this.actionTarget !== null && this.actions) {
                this.target.tools[this.featureManager].on("layerchange", function(mgr, rec, schema) {
                    //if(! schema){
                        //TODO: Solo capas KML y WMS con varias 'LAYERS', desactiva la consulta
                    //}
                    for (var i=this.actions.length-1; i>=0; --i) {
                        this.actions[i].setDisabled(!schema);
                    }
                }, this);
            }
            //this.target = tmpTarget;
        }else{
            this.actions = gxp.plugins.QueryForm.superclass.addActions.apply(this, actions);
            // support custom actions
            if (this.actionTarget !== null && this.actions) {
                this.target.tools[this.featureManager].on("layerchange", function(mgr, rec, schema) {
                    //if(! schema){
                        //TODO: Solo capas KML y WMS con varias 'LAYERS', desactiva la consulta
                    //}
                    for (var i=this.actions.length-1; i>=0; --i) {
                        this.actions[i].setDisabled(!schema);
                    }
                }, this);
            }
        }
        
    }
        
});

Ext.preg(Viewer.widgets.QueryForm.prototype.ptype, Viewer.widgets.QueryForm);
