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

    resultCountText: "{0} results were found.",
    
    /** api: config[autoExpandAlternative]
     *  ``String`` If set to the id of a container, the container will be
     *  expanded when the Query Form is enabled, and collapsed when it is
     *  disabled.Once the user manually expands/collapses the container, the
     *  user setting will NOT stick for the current session.
     */
    autoExpandAlternative: null,
    
    /** private: [isExpanded]
     *  ``Boolean``
     *  Flag to show info boxes only when toogle is enabled
     */
    isExpanded: false,
    
    /** private: [autoHideParent]
     *  ``Boolean``
     *  Flag to hide parent panel when toogle is disabled
     */
    autoHideParent: false,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        Ext.QuickTips.init(); // to display button quicktips
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
                    this.actionToogleHandler(button, pressed);
                },
                scope: this
            }];
        }

        var featureManager = this.target.tools[this.featureManager];

        if(!featureManager
            && !!this.target.target
            && !!this.target.target.tools[this.featureManager]){
            var tmpTarget = this.target;
            this.target = this.target.target;
            featureManager = this.target.tools[this.featureManager];
            
           
            //this.target = tmpTarget;
        }

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
    },

    /** api: method[actionToogleHandler]
     */
    actionToogleHandler: function(button, pressed) {
        if (this.autoExpandAlternative){
            if(this.output.length > 0){
                var expandContainer = Ext.getCmp(this.autoExpandAlternative);
                expandContainer[pressed ? 'expand' : 'collapse']();
                if (pressed) {
                    this.isExpanded = true;
                    expandContainer.expand();
                    if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                        expandContainer.ownerCt.expand();
                    }
                } else {
                    this.isExpanded = false;
                    expandContainer.collapse();
                    if(this.autoHideParent){
                        if (expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
                            expandContainer.ownerCt.collapse();
                        }
                    }
                    this.target.tools[this.featureManager].loadFeatures();
                }
            }else{
                var this_ = this;
                setTimeout(function() {
                    this_.actionToogleHandler(button, pressed);
                }, 10);
            }
        }
    },

    /** api: method[addOutput]
     */
    addOutput : function(config) {
        //var form = Viewer.widgets.QueryForm.superclass.addOutput.apply(this, config);
        // #85695: Only show message box when toogle is pressed
        var form = this.addOutputModified(config);
        var queryButton = form.toolbars[0].items.items[2];
        queryButton.on("click", function(){
            // We only need to show the results count msg if the query form started the query.
            this._queryFormQuery = true;
         }, this);

        this.form = form;

        return form;
    },

    /** api: method[addOutputModified]
     * #85695: Only show message box when toogle is pressed.
     * this method is the same of the parent class with #85695 changes
     */
    addOutputModified: function(config) {
        var featureManager = this.target.tools[this.featureManager];

        config = Ext.apply({
            border: false,
            bodyStyle: "padding: 10px",
            layout: "form",
            width: 320,
            autoScroll: true,
            items: [{
                xtype: "fieldset",
                ref: "spatialFieldset",
                title: this.queryByLocationText,
                anchor: "97%",
                // This fieldset never expands
                style: "margin-bottom:0; border-left-color:transparent; border-right-color:transparent; border-width:1px 1px 0 1px; padding-bottom:0",
                checkboxToggle: true
            }, {
                xtype: "fieldset",
                ref: "attributeFieldset",
                title: this.queryByAttributesText,
                anchor: "97%",
                style: "margin-bottom:0",
                checkboxToggle: true
            }],
            bbar: ["->", {
                text: this.cancelButtonText,
                iconCls: "cancel",
                handler: function() {
                    var ownerCt = this.outputTarget ? queryForm.ownerCt :
                        queryForm.ownerCt.ownerCt;
                    if (ownerCt && ownerCt instanceof Ext.Window) {
                        ownerCt.hide();
                    }
                    addFilterBuilder(
                        featureManager, featureManager.layerRecord,
                        featureManager.schema
                    );
                    featureManager.loadFeatures();
                }
            }, {
                text: this.queryActionText,
                iconCls: "gxp-icon-find",
                handler: function() {
                    var filters = [];
                    if (queryForm.spatialFieldset.collapsed !== true) {
                        filters.push(new OpenLayers.Filter.Spatial({
                            type: OpenLayers.Filter.Spatial.BBOX,
                            property: featureManager.featureStore.geometryName,
                            value: this.target.mapPanel.map.getExtent()
                        }));
                    }
                    if (queryForm.attributeFieldset.collapsed !== true) {
                        var attributeFilter = queryForm.filterBuilder.getFilter();
                        attributeFilter && filters.push(attributeFilter);
                    }
                    featureManager.loadFeatures(filters.length > 1 ?
                        new OpenLayers.Filter.Logical({
                            type: OpenLayers.Filter.Logical.AND,
                            filters: filters
                        }) :
                        filters[0]
                    );
                },
                scope: this
            }]
        }, config || {});
        var queryForm = gxp.plugins.QueryForm.superclass.addOutput.call(this, config);

        this.form = queryForm;
        
        var expandContainer = null, userExpand = true;
        if (this.autoExpand) {
            expandContainer = Ext.getCmp(this.autoExpand);
            function stopAutoExpand() {
                if (userExpand) {
                    expandContainer.un('expand', stopAutoExpand);
                    expandContainer.un('collapse', stopAutoExpand);
                    expandContainer = null;
                }
                userExpand = true;
            }
            expandContainer.on({
                'expand': stopAutoExpand,
                'collapse': stopAutoExpand
            });
        }

        featureManager.on("layerchange", this.addFilterBuilder, this);

        this.addFilterBuilder(featureManager,
            featureManager.layerRecord, featureManager.schema
        );
        
        featureManager.on({
            "beforequery": function() {
                this.beforeQueryHandle();
            },
            "query": function(tool, store) {
                this.queryHandle(tool, store);
            },
            scope: this
        });
        
        return queryForm;
    },

    /** private: method[addFilterBuilder]
     * #85695: Only remove fieldset when has layout
     */
    addFilterBuilder: function(mgr, rec, schema) {
        queryForm = this.form;
        // #85695: Only remove fieldset when has layout
        if(queryForm.attributeFieldset.getEl()){
            queryForm.attributeFieldset.removeAll();
        }
        queryForm.setDisabled(!schema);
        if (schema) {
            queryForm.attributeFieldset.add({
                xtype: "gxp_filterbuilder",
                ref: "../filterBuilder",
                attributes: schema,
                allowBlank: true,
                allowGroups: false
            });
            queryForm.spatialFieldset.expand();
            queryForm.attributeFieldset.expand();
        } else if(queryForm.attributeFieldset.getEl()){
            queryForm.attributeFieldset.rendered && queryForm.attributeFieldset.collapse();
            queryForm.spatialFieldset.rendered && queryForm.spatialFieldset.collapse();
        }
        queryForm.attributeFieldset.doLayout();
    },

    /** private: method[queryHandle]
     * #85695: Only remove fieldset when has layout
     */
    queryHandle: function(tool, store) {
        if (store) {
            if (this.target.tools[this.featureManager].featureStore !== null) {

                // #85695: Only show message box when toogle is pressed
                if (this.isExpanded){ 
                    store.getCount() || Ext.Msg.show({
                        title: this.noFeaturesTitle,
                        msg: this.noFeaturesMessage,
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.INFO
                    });
                }

                if (this.autoHide) {
                    var ownerCt = this.outputTarget ? queryForm.ownerCt :
                        queryForm.ownerCt.ownerCt;
                    ownerCt instanceof Ext.Window && ownerCt.hide();
                }
            }
        }
        if (this.isExpanded  // #85695: Only show message box when toogle is pressed
            && this._queryFormQuery && store && store.getCount()) {
            this._queryFormQuery = false;                        
            Ext.Msg.alert("", this.resultCountText.replace("{0}",featureManager.numberOfFeatures));                    
        }
    }, 

    /** private: method[beforeQueryHandle]
     * #85695: Only remove fieldset when has layout
     */
    beforeQueryHandle: function() {
        // #85695: Only show message box when toogle is pressed
        if (this.isExpanded
            && !!this.form.getEl()){ 
            new Ext.LoadMask(this.form.getEl(), {
                store: this.featureManager.featureStore,
                msg: this.queryMsg
            }).show();
        }
    }
        
});

Ext.preg(Viewer.widgets.QueryForm.prototype.ptype, Viewer.widgets.QueryForm);
