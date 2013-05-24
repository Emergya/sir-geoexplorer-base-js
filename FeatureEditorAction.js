/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */


/**
 * @requires plugins/FeatureEditor.js
 */
/** api: (define)
 *  module = gxp.plugins
 *  class = FeatureEditorAction
 */

/** api: (extends)
 *  plugins/FeatureEditor.js
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 */
Viewer.plugins.FeatureEditorAction = Ext.extend(gxp.plugins.FeatureEditor, {

    /** api: ptype = vw_featureeditor */
    ptype: "vw_featureeditor",

    /** public: api[errorText] */
    errorText: "An error has occurred. Please try again.",
    /** public: api[waitText] */
    waitText: "Please wait...",

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        Viewer.plugins.FeatureEditorAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    addActions: function() {


        window.app.on({
            layerselectionchange: this.enableOrDisable,
            loginstatechange: this.enableOrDisable,
            scope: this
        });

        var popup;
        var featureManager = this.getFeatureManager();
        var featureLayer = featureManager.featureLayer;
        
        var intercepting = false;
        // intercept calls to methods that change the feature store - allows us
        // to persist unsaved changes before calling the original function
        function intercept(mgr, fn) {
            var fnArgs = Array.prototype.slice.call(arguments);
            // remove mgr and fn, which will leave us with the original
            // arguments of the intercepted loadFeatures or setLayer function
            fnArgs.splice(0, 2);
            if (!intercepting && popup && !popup.isDestroyed) {
                if (popup.editing) {
                    function doIt() {
                        intercepting = true;
                        unregisterDoIt.call(this);
                        if (fn === "setLayer") {
                            this.target.selectLayer(fnArgs[0]);
                        } else if (fn === "clearFeatures") {
                            // nothing asynchronous involved here, so let's
                            // finish the caller first before we do anything.
                            window.setTimeout(function() {mgr[fn].call(mgr);});
                        } else {
                            mgr[fn].apply(mgr, fnArgs);
                        }
                    }
                    function unregisterDoIt() {
                        featureManager.featureStore.un("write", doIt, this);
                        popup.un("canceledit", doIt, this);
                        popup.un("cancelclose", unregisterDoIt, this);
                    }
                    featureManager.featureStore.on("write", doIt, this);
                    popup.on({
                        canceledit: doIt,
                        cancelclose: unregisterDoIt,
                        scope: this
                    });
                    popup.close();
                }
                return !popup.editing;
            }
            intercepting = false;
        }
        featureManager.on({
            // TODO: determine where these events should be unregistered
            "beforequery": intercept.createDelegate(this, "loadFeatures", 1),
            "beforelayerchange": intercept.createDelegate(this, "setLayer", 1),
            "beforesetpage": intercept.createDelegate(this, "setPage", 1),
            "beforeclearfeatures": intercept.createDelegate(this, "clearFeatures", 1),
            scope: this
        });
        
        this.drawControl = new OpenLayers.Control.DrawFeature(
            featureLayer,
            OpenLayers.Handler.Point, 
            {
                eventListeners: {
                    featureadded: function(evt) {
                        if (this.autoLoadFeature === true) {
                            this.autoLoadedFeature = evt.feature;
                        }
                    },
                    activate: function() {
                        
                        featureManager.showLayer(
                            this.id, this.showSelectedOnly && "selected"
                        );
                        
                    },
                    deactivate: function() {
                        featureManager.hideLayer(this.id);
                    },
                    scope: this
                }
            }
        );
        
        // create a SelectFeature control
        // "fakeKey" will be ignord by the SelectFeature control, so only one
        // feature can be selected by clicking on the map, but allow for
        // multiple selection in the featureGrid
        this.selectControl = new OpenLayers.Control.SelectFeature(featureLayer, {
            clickout: false,
            multipleKey: "fakeKey",
            eventListeners: {
                "activate": function() {
                  
                    Ext.select(".olMap").setStyle("cursor", "crosshair");

                    if (this.autoLoadFeature === true || featureManager.paging) {
                        this.target.mapPanel.map.events.register(
                            "click", this, this.noFeatureClick
                        );
                    }

                    featureManager.showLayer(
                        this.id, this.showSelectedOnly && "selected"
                    );
                    this.selectControl.unselectAll(
                        popup && popup.editing && {except: popup.feature}
                    );
                  
                },
                "deactivate": function() {
                    Ext.select(".olMap").setStyle("cursor", "default");
                    if (this.autoLoadFeature === true || featureManager.paging) {
                        this.target.mapPanel.map.events.unregister(
                            "click", this, this.noFeatureClick
                        );
                    }
                    if (popup) {
                        if (popup.editing) {
                            popup.on("cancelclose", function() {
                                this.selectControl.activate();
                            }, this, {single: true});
                        }
                        popup.on("close", function() {
                            featureManager.hideLayer(this.id);
                        }, this, {single: true});
                        popup.close();
                    } else {
                        featureManager.hideLayer(this.id);
                    }
                },
                scope: this
            }
        });
        
        featureLayer.events.on({
            "beforefeatureremoved": function(evt) {
                if (this.popup && evt.feature === this.popup.feature) {
                    this.selectControl.unselect(evt.feature);
                }
            },
            "featureunselected": function(evt) {
                var feature = evt.feature;
                if (feature) {
                    this.fireEvent("featureeditable", this, feature, false);
                }
                if (feature && feature.geometry && popup && !popup.hidden) {
                    popup.close();
                }
            },
            "beforefeatureselected": function(evt) {
                //TODO decide if we want to allow feature selection while a
                // feature is being edited. If so, we have to revisit the
                // SelectFeature/ModifyFeature setup, because that would
                // require to have the SelectFeature control *always*
                // activated *after* the ModifyFeature control. Otherwise. we
                // must not configure the ModifyFeature control in standalone
                // mode, and use the SelectFeature control that comes with the
                // ModifyFeature control instead.
                if(popup) {
                    return !popup.editing;
                }
            },
            "featureselected": function(evt) {

                var feature = evt.feature;
                if (feature) {
                    this.fireEvent("featureeditable", this, feature, true);
                }
                var featureStore = featureManager.featureStore;
                if(this._forcePopupForNoGeometry === true || (this.selectControl.active && feature.geometry !== null)) {
                    // deactivate select control so no other features can be
                    // selected until the popup is closed
                    if (this.readOnly === false) {
                        //this.selectControl.deactivate();
                        // deactivate will hide the layer, so show it again
                        featureManager.showLayer(this.id, this.showSelectedOnly && "selected");
                    }
                    popup = this.addOutput({
                        xtype: "gxp_featureeditpopup",
                        collapsible: true,
                        feature: featureStore.getByFeature(feature),
                        vertexRenderIntent: "vertex",
                        readOnly: this.readOnly,
                        fields: this.fields,
                        excludeFields: this.excludeFields,
                        editing: feature.state === OpenLayers.State.INSERT,
                        schema: this.schema,
                        allowDelete: true,
                        width: 200,
                        height: 250,
                        map: Viewer.getMapPanel()
                    });
                    popup.on({
                        "close": function() {
                            if (this.readOnly === false && this.drawControl.active) {
                               this.selectControl.activate();
                            }
                            if(feature.layer && feature.layer.selectedFeatures.indexOf(feature) !== -1) {
                                this.selectControl.unselect(feature);
                            }
                            if (feature === this.autoLoadedFeature) {
                                if (feature.layer) {
                                    feature.layer.removeFeatures([evt.feature]);
                                }
                                this.autoLoadedFeature = null;
                            }
                        },
                        "featuremodified": function(popup, feature) {
                            featureStore.on({
                                beforewrite: {
                                    fn: function(store, action, rs, options) {
                                        if (this.commitMessage === true) {
                                            options.params.handle = this._commitMsg;
                                            delete this._commitMsg;
                                        }
                                    },
                                    single: true
                                },
                                beforesave: {
                                    fn: function() {
                                        if (popup && popup.isVisible()) {
                                            popup.disable();
                                        }
                                      
                                        Ext.Msg.wait(this.waitText);
                                    },
                                    single: this.commitMessage !== true
                                },
                                write: {
                                    fn: function() {
                                        if (popup) {
                                            if (popup.isVisible()) {
                                                popup.enable();
                                            }
                                            if (this.closeOnSave) {
                                                popup.close();
                                            }
                                        }
                                        var layer = featureManager.layerRecord;
                                        this.target.fireEvent("featureedit", featureManager, {
                                            name: layer.get("name"),
                                            source: layer.get("source")
                                        });

                                        Ext.Msg.updateProgress(1);
                                        Ext.Msg.hide();
                                    },
                                    single: true
                                },
                                exception: {
                                    fn: function(proxy, type, action, options, response, records) {
                                        Ext.Msg.updateProgress(1);
                                        Ext.Msg.hide();

                                        var msg = this.exceptionText;
                                        if (type === "remote") {
                                            // response is service exception
                                            if (response.exceptionReport) {
                                                msg = gxp.util.getOGCExceptionText(response.exceptionReport);
                                            }
                                        } else {
                                            // non-200 response from server
                                            msg = "Status: " + response.status;
                                        }
                                        // fire an event on the feature manager
                                        featureManager.fireEvent("exception", featureManager, 
                                            response.exceptionReport || {}, msg, records);
                                        // only show dialog if there is no listener registered
                                        if (featureManager.hasListener("exception") === false && 
                                            featureStore.hasListener("exception") === false) {
                                                Ext.Msg.show({
                                                    title: this.exceptionTitle,
                                                    msg: msg,
                                                    icon: Ext.MessageBox.ERROR,
                                                    buttons: {ok: true}
                                                });
                                        }
                                        if (popup && popup.isVisible()) {
                                            popup.enable();
                                            popup.startEditing();
                                        }
                                    },
                                    single: true
                                },
                                scope: this
                            });                                
                            if(feature.state === OpenLayers.State.DELETE) {
                                /**
                                 * If the feature state is delete, we need to
                                 * remove it from the store (so it is collected
                                 * in the store.removed list.  However, it should
                                 * not be removed from the layer.  Until
                                 * http://trac.geoext.org/ticket/141 is addressed
                                 * we need to stop the store from removing the
                                 * feature from the layer.
                                 */
                                featureStore._removing = true; // TODO: remove after http://trac.geoext.org/ticket/141
                                featureStore.remove(featureStore.getRecordFromFeature(feature));
                                delete featureStore._removing; // TODO: remove after http://trac.geoext.org/ticket/141
                            }
                            featureStore.save();
                        },
                        "canceledit": function(popup, feature) {
                            featureStore.commitChanges();
                        },
                        scope: this
                    });
                    this.popup = popup;
                }
            },
            "sketchcomplete": function(evt) {
                // Why not register for featuresadded directly? We only want
                // to handle features here that were just added by a
                // DrawFeature control, and we need to make sure that our
                // featuresadded handler is executed after any FeatureStore's,
                // because otherwise our selectControl.select statement inside
                // this handler would trigger a featureselected event before
                // the feature row is added to a FeatureGrid. This, again,
                // would result in the new feature not being shown as selected
                // in the grid.
                if(!this.drawControl.active) {
                    // We are not drawing with this tool.
                    return;
                }
                featureManager.featureLayer.events.register("featuresadded", this, function(evt) {
                    featureManager.featureLayer.events.unregister("featuresadded", this, arguments.callee);
                    this.drawControl.deactivate();
                    this.selectControl.activate();
                    this.selectControl.select(evt.features[0]);
                });
            },
            scope: this
        });

        var toggleGroup = this.toggleGroup || Ext.id();

        var actions = [];
        var commonOptions = {
            tooltip: this.createFeatureActionTip,
            // backwards compatibility: only show text if configured
            menuText: this.initialConfig.createFeatureActionText,
            text: this.initialConfig.createFeatureActionText,
            iconCls: this.iconClsAdd,
            disabled: true,
            hidden: this.modifyOnly || this.readOnly,
            toggleGroup: toggleGroup,
            //TODO Tool.js sets group, but this doesn't work for GeoExt.Action
            group: toggleGroup,
            groupClass: null,
            enableToggle: true,
            allowDepress: true,
            control: this.drawControl,
            deactivateOnDisable: true,
            map: this.target.mapPanel.map,
            listeners: {checkchange: this.onItemCheckchange, scope: this}
        };
        if (this.supportAbstractGeometry === true) {
            var menuItems = [];
            if (this.supportNoGeometry === true) {
                menuItems.push(
                    new Ext.menu.CheckItem({
                        text: this.noGeometryText,
                        iconCls: "gxp-icon-event",
                        groupClass: null,
                        group: toggleGroup,
                        listeners: {
                            checkchange: function(item, checked) {
                                if (checked === true) {
                                    var feature = new OpenLayers.Feature.Vector(null);
                                    feature.state = OpenLayers.State.INSERT;
                                    featureLayer.addFeatures([feature]);
                                    this._forcePopupForNoGeometry = true;
                                    featureLayer.events.triggerEvent("featureselected", {feature: feature});
                                    delete this._forcePopupForNoGeometry;
                                }
                                if (this.createAction.items[0] instanceof Ext.menu.CheckItem) {
                                    this.createAction.items[0].setChecked(false);
                                } else {
                                    this.createAction.items[0].toggle(false);
                                }
                            },
                            scope: this
                        }
                    })
                );
            }
            var checkChange = function(item, checked, Handler) {
                if (checked === true) {
                    this.setHandler(Handler, false);
                }
                if (this.createAction.items[0] instanceof Ext.menu.CheckItem) {
                    this.createAction.items[0].setChecked(checked);
                } else {
                    this.createAction.items[0].toggle(checked);
                }
            };
            menuItems.push(
                new Ext.menu.CheckItem({
                    groupClass: null,
                    text: this.pointText,
                    group: toggleGroup,
                    iconCls: 'gxp-icon-point',
                    listeners: {
                        checkchange: checkChange.createDelegate(this, [OpenLayers.Handler.Point], 2)
                    }
                }),
                new Ext.menu.CheckItem({
                    groupClass: null,
                    text: this.lineText,
                    group: toggleGroup,
                    iconCls: 'gxp-icon-line',
                    listeners: {
                        checkchange: checkChange.createDelegate(this, [OpenLayers.Handler.Path], 2)
                    }
                }),
                new Ext.menu.CheckItem({
                    groupClass: null,
                    text: this.polygonText,
                    group: toggleGroup,
                    iconCls: 'gxp-icon-polygon',
                    listeners: {
                        checkchange: checkChange.createDelegate(this, [OpenLayers.Handler.Polygon], 2)
                    }
                })
            );

            actions.push(
                new GeoExt.Action(Ext.apply(commonOptions, {
                    menu: new Ext.menu.Menu({items: menuItems})
                }))
            );
        } else {
            actions.push(new GeoExt.Action(commonOptions));
        }
        actions.push(new GeoExt.Action({
            tooltip: this.editFeatureActionTip,
            // backwards compatibility: only show text if configured
            text: this.initialConfig.editFeatureActionText,
            menuText: this.initialConfig.editFeatureActionText,
            iconCls: this.iconClsEdit,
            disabled: true,
            toggleGroup: toggleGroup,
            //TODO Tool.js sets group, but this doesn't work for GeoExt.Action
            group: toggleGroup,
            groupClass: null,
            enableToggle: true,
            allowDepress: true,
            control: this.selectControl,
            deactivateOnDisable: true,
            map: this.target.mapPanel.map,
            listeners: {checkchange: this.onItemCheckchange, scope: this}
        }));
        
        this.createAction = actions[0];
        this.editAction = actions[1];
        
        if (this.splitButton) {
            this.splitButton = new Ext.SplitButton({
                menu: {items: [
                    Ext.apply(new Ext.menu.CheckItem(actions[0]), {
                        text: this.createFeatureActionText
                    }),
                    Ext.apply(new Ext.menu.CheckItem(actions[1]), {
                        text: this.editFeatureActionText
                    })
                ]},
                disabled: true,
                buttonText: this.splitButtonText,
                tooltip: this.splitButtonTooltip,
                iconCls: this.iconClsAdd,
                enableToggle: true,
                toggleGroup: this.toggleGroup,
                allowDepress: true,
                handler: function(button, event) {
                    if(button.pressed) {
                        button.menu.items.itemAt(this.activeIndex).setChecked(true);
                    }
                },
                scope: this,
                listeners: {
                    toggle: function(button, pressed) {
                        // toggleGroup should handle this
                        if(!pressed) {
                            button.menu.items.each(function(i) {
                                i.setChecked(false);
                            });
                        }
                    },
                    render: function(button) {
                        // toggleGroup should handle this
                        Ext.ButtonToggleMgr.register(button);
                    }
                }
            });
            actions = [this.splitButton];
        }

        actions = gxp.plugins.FeatureEditor.superclass.addActions.call(this, actions);

        featureManager.on("layerchange", this.onLayerChange, this);

        var snappingAgent = this.getSnappingAgent();
        if (snappingAgent) {
            snappingAgent.registerEditor(this);
        }

         this.enableOrDisable();

        return actions;
    },

    /** private: method[getFeatureManager]
     * Overwrite the original method so we can find
     * featuremanagers defined in Composer.js
     * :returns: :class:`gxp.plugins.FeatureManager`
     */
    getFeatureManager: function() {
        var manager = this.target.tools[this.featureManager];
        if (!manager) {
            manager = window.app.tools[this.featureManager];
            if (manager) {
                // This fix the same problem in ClickableFeature.js
                this.target.tools[this.featureManager] = manager;
            }
        }
        if (!manager) {
            throw new Error("Unable to access feature manager by id: " + this.featureManager);
        }
        return manager;
    },


    enableOrDisable: function() {
        var mgr = this.getFeatureManager();
        var layerRecord = mgr.layerRecord;


        var authIdLayer = null;
        var authIdUser = null;
        var isAdmin = null;
        var layerId = null;
        var isTemporal = null;
        var layer = null;
        // Institución de la capa
        if ( !! layerRecord && !! layerRecord.data && !! layerRecord.data.layer && layerRecord.data.layer.params && mgr.geometryType) {
            layer = layerRecord.data.layer;
            if (layer.authId) {
                authIdLayer = layer.authId;
            }

            if (layer.layerID) {
                layerId = layer.layerID;
            }

            if (layer.metadata && layer.metadata.temporal) {
                isTemporal = true;
            }
        }
        // Institución del usuario
        if ( !! app && !! app.persistenceGeoContext && !! app.persistenceGeoContext.userInfo && !! app.persistenceGeoContext.userInfo.authorityId) {
            authIdUser = app.persistenceGeoContext.userInfo.authorityId;
            isAdmin = app.persistenceGeoContext.userInfo.admin;
        }

        // Comprobamos si el usuario tiene permisos en la capa
        if (layer && (isTemporal || layerId && (isAdmin || !!authIdUser && authIdLayer == authIdUser))) {
            this.actions[0].enable();
            this.actions[1].enable();

        } else {
            // Disable the edit options
            this.actions[0].disable();
            this.actions[1].disable();

        }
    },
    
    /** private: method[onLayerChange]
     *  :arg mgr: :class:`gxp.plugins.FeatureManager`
     *  :arg layer: ``GeoExt.data.LayerRecord``
     *  :arg schema: ``GeoExt.data.AttributeStore``
     */
    onLayerChange: function(mgr, layer, schema) {
        if(!!mgr 
            && !!mgr.geometryType){ // skip exception
            Viewer.plugins.FeatureEditorAction.superclass.onLayerChange.apply(this, arguments);
        }
    }

});

Ext.preg(Viewer.plugins.FeatureEditorAction.prototype.ptype, Viewer.plugins.FeatureEditorAction);