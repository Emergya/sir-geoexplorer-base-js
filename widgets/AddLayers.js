/*
 * AddLayers.js
 *
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
 * Authors:: Alejandro Díaz Torres (mailto:adiaz@emergya.com)
 *
 */

/**
 * @requires widgets/AddLayers.js
 * @requires widgets/WfsWizard.js
 */

/** api: (define)
 *  module = Viewer.plugins
 *  class = AddLayers
 */

/** api: (extends)
 *  widgets/AddLayers,js
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: AddLayers(config)
 *
 *    Plugin for removing a selected layer from the map.
 *    TODO Make this plural - selected layers
 */
Viewer.plugins.AddLayers = Ext.extend(gxp.plugins.AddLayers, {

    ptype: "vw_addlayers",


    /** i18n **/
    addButtonText: "Add Layers",
    previewLayerText: "Preview of '{0}' layer",
    panelSRSText: "SRS",
    onlyCompatibleText: "Only compatibles",
    makePersistentText: "Make persistent?",
    uploadKMLText: "Upload a KML",
    uploadRasterText: "Upload a Raster",
    uploadShapeText: "Upload a SHP in a ZIP file",
    uploadXlsText: "Upload a XLS file",
    uploadKmlImportText: "Upload a KML file",
    invalidWMSURLText: "Enter a valid URL to a WMS endpoint (e.g. http://example.com/geoserver/wms)",
    addWMSLayerActionText: "Add WMS layer...",
    temporaryLayerActionText: "Temporary layer...",
    addWFSLayerActionText: "WFS...",
    findActionMenuText: "Find Layers...",
    tempLayerWindowTitleText: "Create Temporary Layer",
    tempLayerPointText: "Point",
    tempLayerLineText: "Line",
    tempLayerPolygonText: "Polygon",
    tempLayerNameLabelText: "Name",
    tempLayerCreateButtonText: "Create",
    tempLayerCancelButtonText: "Cancel",
    tempLayerDescriptionText: "Create a temporary layer of selected geometry type",
    nameBlankText: "Layer name cannot be empty.",
    waitText: "Please wait...",

    /** Remove parameters **/
    removeText: "Remove",
    removeTitleText: "Remove source permanently",
    removeSourceWindowTitleText: "Remove source",
    removeSourceWindowText: "Remove Source '{0}' ({1}) removed permanently?",
    verboseRemove: true,

    uploadShpWindow: null,
    uploadXlsWindow: null,
    //    uploadKmlImporterWindow: null,

    /** Indicate show preview window **/
    activePreview: true,

    /** Default height **/
    height: 300,

    /** Default width **/
    width: 315,

    /** Default prewiev window width **/
    prewievWidth: 512,

    /** Default prewiev window height **/
    previewHeight: 256,
    /**  If when adding layers the make persist window will be shown **/
    showPersistWindowOnAdd: false,

    /** api: method[addActions]
     */
    addActions: function() {
        var commonOptions = {
            tooltip: this.addActionTip,
            text: this.addActionText,
            menuText: this.addActionMenuText,
            disabled: true,
            iconCls: "gxp-icon-addlayers"
        };
        var options, uploadButton, uploadKMLButton, uploadRasterButton;
        if (this.initialConfig.search || (this.uploadSource)) {
            var items = [new Ext.menu.Item({
                    iconCls: 'vw-icon-add-layer-wms',
                    tooltip: "Add WMS Layer",
                    text: this.addWMSLayerActionText,
                    handler: this.showCapabilitiesGrid,
                    scope: this
                })];

            items.push(new Ext.menu.Item({
                iconCls: 'vw-icon-add-layer-wfs',
                text: this.addWFSLayerActionText,
                tooltip: "Add WFS Feature Type",
                handler: this.showCatalogueWFSSearch,
                scope: this
            }));
            items.push(new Ext.menu.Item({
                iconCls: 'vw-icon-add-layer-vector',
                text: this.temporaryLayerActionText,
                tooltip: "Add temporary layer",
                handler: this.createTemporaryLayer,
                scope: this
            }));

            if (this.initialConfig.search) {
                items.push(new Ext.menu.Item({
                    iconCls: 'gxp-icon-addlayers',
                    text: this.findActionMenuText,
                    handler: this.showCatalogueSearch,
                    scope: this
                }));
            }

            items.push(new Ext.menu.Item({
                iconCls: 'vw-icon-add-layer-shp',
                text: this.uploadShapeText,
                handler: this.uploadShapeHandler,
                scope: this
            }));
            items.push(new Ext.menu.Item({
                iconCls: 'vw-icon-add-layer-shp',
                text: this.uploadXlsText,
                handler: this.uploadXlsHandler,
                scope: this
            }));
            items.push(new Ext.menu.Item({
                iconCls: 'gxp-icon-filebrowse',
                text: this.uploadRasterText,
                handler: this.uploadRasterHandler,
                scope: this
            }));
            items.push(new Ext.menu.Item({
                iconCls: 'vw-icon-add-layer-shp',
                text: this.uploadKmlImportText,
                handler: this.uploadKmlHandler,
                scope: this
            }));
            if (this.uploadSource) {
                //TODO: Activate upload buttons
                // uploadButton = this.createUploadButton(Ext.menu.Item);
                // if (uploadButton) {
                //     items.push(uploadButton);
                // }
                // uploadKMLButton = this.createUploadKMLButton(Ext.menu.Item);
                // if (uploadKMLButton) {
                //     items.push(uploadKMLButton);
                // }
                // uploadRasterButton = this.createUploadRasterButton(Ext.menu.Item);
                // if (uploadRasterButton) {
                //     items.push(uploadRasterButton);
                // }
            }
            options = Ext.apply(commonOptions, {
                menu: new Ext.menu.Menu({
                    items: items
                })
            });
        } else {
            options = Ext.apply(commonOptions, {
                handler: this.getAddLayersPanel,
                scope: this
            });
        }
        var actions = gxp.plugins.AddLayers.superclass.addActions.apply(this, [options]);

        this.target.on("ready", function() {
            if (this.uploadSource) {
                var source = this.target.layerSources[this.uploadSource];
                if (source) {
                    this.setSelectedSource(source);
                } else {
                    delete this.uploadSource;
                    if (uploadButton) {
                        uploadButton.hide();
                    }
                    if (uploadKMLButton) {
                        uploadKMLButton.hide();
                    }
                    if (uploadRasterButton) {
                        uploadRasterButton.hide();
                    }
                    // TODO: add error logging
                    // throw new Error("Layer source for uploadSource '" + this.uploadSource + "' not found.");
                }
            }
            actions[0].enable();
        }, this);

        return actions;
    },

    /**
     * api: method[uploadShapeHandler]
     */
    uploadShapeHandler: function() {
        if (!this.uploadShpWindow) {
            this.uploadShpWindow = new Viewer.plugins.ShpWizard();
            this.uploadShpWindow.on({
                'close': {
                    fn: function() {
                        this.uploadShpWindow = null;
                    },
                    scope: this
                }
            });

        }
        this.uploadShpWindow.show();

    },
    /**
     * api: method[uploadXlsHandler]
     */
    uploadXlsHandler: function() {
        if (!this.uploadXlsWindow) {
            this.uploadXlsWindow = new Viewer.plugins.XLSWizard();
            this.uploadXlsWindow.on({
                'close': {
                    fn: function() {
                        this.uploadXlsWindow = null;
                    },
                    scope: this
                }
            });

        }
        this.uploadXlsWindow.show();

    },

    /**
     * api: method[uploadKmlHandler]
     */
    uploadKmlHandler: function() {
        if (!this.uploadKmlImporterWindow) {
            this.uploadKmlImporterWindow = new Viewer.plugins.KMLWizard();
            this.uploadKmlImporterWindow.on({
                'close': {
                    fn: function() {
                        this.uploadKmlImporterWindow = null;
                    },
                    scope: this
                }
            });

        }
        this.uploadKmlImporterWindow.show();

    },

    /**
     * api: method[uploadShapeHandler]
     */
    uploadRasterHandler: function() {
        if (!this.uploadRasterWindow) {
            this.uploadRasterWindow = new Viewer.plugins.RasterUploadPanel();
            this.uploadRasterWindow.on({
                'close': {
                    fn: function() {
                        this.uploadRasterWindow = null;
                    },
                    scope: this
                }
            });

        }
        this.uploadRasterWindow.show();
    },

    /** api: method[createUploadRasterButton]
     *  :arg Cls: ``Function`` The class to use for creating the button. If not
     *      provided, an ``Ext.Button`` instance will be created.
     *      ``Ext.menu.Item`` would be another option.
     *  If this tool is provided an ``upload`` property, a button will be created
     *  that launches a window with a :class:`gxp.LayerUploadPanel`.
     */
    createUploadRasterButton: function(Cls) {
        Cls = Cls || Ext.Button;
        var uploadConfig = this.initialConfig.upload || !! this.initialConfig.uploadSource;
        var button;
        var url;
        if (uploadConfig) {
            if (typeof uploadConfig === "boolean") {
                uploadConfig = {};
            }

            button = new Cls({
                text: this.uploadRasterText,
                iconCls: "gxp-icon-filebrowse",
                hidden: !this.uploadSource,
                handler: function() {
                    this.target.doAuthorized(this.uploadRoles, function() {
                        var panel = new Viewer.plugins.RasterUploadPanel(Ext.apply({
                            title: this.outputTarget ? this.uploadText : undefined,
                            url: url,
                            width: 350,
                            border: false,
                            bodyStyle: "padding: 10px 10px 0 10px;",
                            labelWidth: 65,
                            autoScroll: true,
                            defaults: {
                                anchor: "99%",
                                allowBlank: false,
                                msgTarget: "side"
                            },
                            listeners: {
                                uploadcomplete: function(panel, detail) {
                                    var layers = detail["import"].tasks[0].items;
                                    var item, names = {}, resource, layer;
                                    for (var i = 0, len = layers.length; i < len; ++i) {
                                        item = layers[i];
                                        if (item.state === "ERROR") {
                                            Ext.Msg.alert(item.originalName, item.errorMessage);
                                            return;
                                        }
                                        resource = item.resource;
                                        layer = resource.featureType || resource.coverage;
                                        names[layer.namespace.name + ":" + layer.name] = true;
                                    }
                                    this.selectedSource.store.load({
                                        callback: function(records, options, success) {
                                            var gridPanel, sel;
                                            if (this.capGrid && this.capGrid.isVisible()) {
                                                gridPanel = this.capGrid.get(0).get(0);
                                                sel = gridPanel.getSelectionModel();
                                                sel.clearSelections();
                                            }
                                            // select newly added layers
                                            var newRecords = [];
                                            var last = 0;
                                            this.selectedSource.store.each(function(record, index) {
                                                if (record.get("name") in names) {
                                                    last = index;
                                                    newRecords.push(record);
                                                }
                                            });
                                            if (gridPanel) {
                                                // this needs to be deferred because the 
                                                // grid view has not refreshed yet
                                                window.setTimeout(function() {
                                                    sel.selectRecords(newRecords);
                                                    gridPanel.getView().focusRow(last);
                                                }, 100);
                                            } else {
                                                this.addLayers(newRecords, true);
                                            }
                                        },
                                        scope: this
                                    });
                                    if (this.outputTarget) {
                                        panel.hide();
                                    } else {
                                        win.close();
                                    }
                                },
                                scope: this
                            }
                        }, uploadConfig));

                        var win;
                        if (this.outputTarget) {
                            this.addOutput(panel);
                        } else {
                            win = new Ext.Window({
                                title: this.uploadRasterText,
                                modal: true,
                                resizable: false,
                                items: [panel]
                            });
                            win.show();
                        }
                    }, this);
                },
                scope: this
            });
        }

        return button;
    },

    /** api: method[createUploadButton]
     *  :arg Cls: ``Function`` The class to use for creating the button. If not
     *      provided, an ``Ext.Button`` instance will be created.
     *      ``Ext.menu.Item`` would be another option.
     *  If this tool is provided an ``upload`` property, a button will be created
     *  that launches a window with a :class:`gxp.LayerUploadPanel`.
     */
    createUploadKMLButton: function(Cls) {

        var win = new Ext.Window({
            title: this.uploadKMLText,
            modal: true,
            closeAction: 'hide',
            resizable: false
        });

        var panel = new Viewer.plugins.KMLUploadPanel(Ext.apply({
            title: this.outputTarget ? this.uploadKMLText : undefined,
            width: 300,
            border: false,
            bodyStyle: "padding: 10px 10px 0 10px;",
            labelWidth: 65,
            autoScroll: true,
            target: this.target,
            authorized: this.target.isAuthorized(),
            win: win,
            defaults: {
                anchor: "99%",
                allowBlank: false,
                msgTarget: "side"
            }
        }, uploadConfig));

        win.add(panel);

        Cls = Cls || Ext.Button;

        var uploadConfig = this.initialConfig.upload || !! this.initialConfig.uploadSource;

        var button = new Cls({
            text: this.uploadKMLText,
            iconCls: "gxp-icon-filebrowse",
            hidden: !this.uploadSource,
            handler: function() {
                win.show();
            },
            scope: this
        });

        var urlCache = {};

        function getStatus(url, callback, scope) {
            if (url in urlCache) {
                // always call callback after returning
                window.setTimeout(function() {
                    callback.call(scope, urlCache[url]);
                }, 0);
            } else {
                Ext.Ajax.request({
                    url: url,
                    disableCaching: false,
                    callback: function(options, success, response) {
                        var status = response.status;
                        urlCache[url] = status;
                        callback.call(scope, status);
                    }
                });
            }
        }

        this.on({
            sourceselected: function(tool, source) {
                button[this.uploadSource ? "show" : "hide"]();
                var show = false;
                if (this.isEligibleForUpload(source)) {
                    url = this.getGeoServerRestUrl(source.url);
                    if (this.target.isAuthorized()) {
                        // determine availability of upload functionality based
                        // on a 200 for GET /imports
                        getStatus(url + "/imports", function(status) {
                            button.setVisible(status === 200);
                        }, this);
                    }
                }
            },
            scope: this
        });

        return button;
    },

    showCatalogueWFSSearch: function() {
        var map_ = this.target.mapPanel.map;
        var this_ = this;
        var wfsDialog = new Viewer.dialog.WfsWizard({
            scope: this.target,
            makePersistentText: this.makePersistentText,
            returnProjection: this.target.mapPanel.map.projection ? this.target.mapPanel.map.projection : Viewer.GEO_PROJECTION,
            listeners: {
                featureTypeAdded: function(record) {
                    this_.addLayers([record], false);
                    // map_.addLayer(record.getLayer());

                    // if(this.scope.isAuthorized()){
                    //     this_.showSaveLayerWindow(record);
                    // }
                }
            }
        });

        wfsDialog.show();
    },

    /** private: method[addLayers]
     *  :arg records: ``Array`` the layer records to add
     *  :arg isUpload: ``Boolean`` Do the layers to add come from an upload?
     */
    addLayers: function(records, isUpload) {

        if (records.length == 1 &&
            records[0].getLayer() instanceof OpenLayers.Layer.Vector) {
            this.addVectorLayer(records, isUpload);
        } else {
            this.addWMSLayers(records, isUpload);
        }

        //Viewer.plugins.AddLayers.superclass.addLayers.call(this, records, isUpload);


    },

    /** private: method[addWMSLayers]
     *  :arg records: ``Array`` the layer records to add
     *  :arg isUpload: ``Boolean`` Do the layers to add come from an upload?
     *  Only adds WMS layers
     */
    addWMSLayers: function(records, isUpload) {
        var source = this.selectedSource;
        var layerStore = this.target.mapPanel.layers,
            extent, record, layer;
        for (var i = 0, ii = records.length; i < ii; ++i) {
            record = records[i];
            if (record) {
                layer = record.getLayer();
                if (layer.maxExtent) {
                    if (!extent) {
                        extent = record.getLayer().maxExtent.clone();
                    } else {
                        extent.extend(record.getLayer().maxExtent);
                    }
                }
                if (this.showPersistWindowOnAdd && this.target.isAuthorized()) {
                    //  mark temp
                    layer.temporal = true;
                    this.showSaveLayerWindow(records[i]);
                }
                // #78426: Set layerSource in layer.source
                layer.source = source;
                this.target.mapPanel.map.addLayer(layer);
            }
        }
        if (extent) {
            this.target.mapPanel.map.zoomToExtent(extent);
        }
        if (records.length === 1 && record) {
            // select the added layer
            this.target.selectLayer(record);
            if (isUpload && this.postUploadAction) {
                // show LayerProperties dialog if just one layer was uploaded
                var outputConfig,
                    actionPlugin = this.postUploadAction;
                if (!Ext.isString(actionPlugin)) {
                    outputConfig = actionPlugin.outputConfig;
                    actionPlugin = actionPlugin.plugin;
                }
                this.target.tools[actionPlugin].addOutput(outputConfig);
            }
        }
    },

    /** private: method[addWMSLayers]
     *  :arg records: ``Array`` the layer records to add
     *  :arg isUpload: ``Boolean`` Do the layers to add come from an upload?
     *  Only adds Vector layers without source paremeter
     */
    addVectorLayer: function(records, isUpload) {
        this.target.mapPanel.map.addLayer(records[0].getLayer());
        this.layer = records[0].getLayer();
        records[0].getLayer().events.register("loadend", this, this.onLoadEnd);
    },

    /** api: method[onLoadEnd]
     */
    onLoadEnd: function() {
        this.zoomToExtent(this.layer);
    },

    /** api: method[zoomToExtent]
     */
    zoomToExtent: function(layer) {
        var dataExtent;
        if (OpenLayers.Layer.Vector) {
            dataExtent = layer instanceof OpenLayers.Layer.Vector &&
                layer.getDataExtent();
        }
        var extent = layer.restrictedExtent || dataExtent || layer.maxExtent || map.maxExtent;

        if (extent)
            this.target.mapPanel.map.zoomToExtent(extent);
    },

    /**
     * private: method[showSaveLayerWindow]
     * Show a dialog to save a layerRecord
     */
    showSaveLayerWindow: function(layerRecord) {
        var saveWindow = new Ext.Window({
            title: this.makePersistentText,
            closeAction: 'hide',
            width: 500
        });
        var savePanel = new Viewer.widgets.SaveLayerPanel({
            layerRecord: layerRecord,
            authorized: this.target.isAuthorized(),
            target: this.target,
            saveWindow: saveWindow,
            outputTarget: false
        });
        saveWindow.add(savePanel);
        saveWindow.show();
    },

    /**
     * private: method[initCapGrid]
     * Constructs a window with a capabilities grid.
     */
    initCapGrid: function() {
        var source, data = [],
            target = this.target;
        for (var id in target.layerSources) {
            source = target.layerSources[id];
            if (source.store && !source.hidden) {
                data.push([id, source.title || id, source.url]);
            }
        }

        var target = this.target;

        var sources = new Ext.data.ArrayStore({
            fields: ["id", "title", "url"],
            data: data
        });

        this.storedSources = new Ext.data.ArrayStore({
            fields: ["id", "title", "url"],
            data: []
        });

        //old init
        this.initCapGridFromSourceAndData(data, sources, target);

        //restore layer sources
        var tmpSources = {};
        Ext.Ajax.request({
            url: this.target.defaultRestUrl + '/persistenceGeo/loadAllSourceTools',
            method: 'POST',
            success: function(response) {
                var json = Ext.util.JSON.decode(response.responseText);
                var sources2 = json.data;

                var callbackFn = function(id) {
                    // add to combo and select
                    var record = new sources.recordType({
                        id: id,
                        title: tmpSources[target.layerSources[id].url].name
                    });
                    sources.insert(0, [record]);
                };

                var fallbackFn = function(source, msg) {
                    //TODO
                    console.error("Error loading " + msg);
                };

                for (var i = 0; i < json.results; i++) {
                    source = sources2[i];
                    tmpSources[source.url] = sources2[i];
                    if (source.ptype == "gxp_wmscsource" && !! source.url && !! source.id) {
                        var storedRecord = new sources.recordType({
                            id: source.id,
                            title: source.name,
                            url: source.url
                        });
                        this.storedSources.insert(0, [storedRecord]);
                        this.target.addLayerSource({
                            config: {
                                url: source.url,
                                name: source.name
                            }, // assumes default of gx_wmssource
                            callback: callbackFn,
                            fallback: fallbackFn,
                            scope: this
                        });
                    }
                }
            },
            failure: function(response) {
                //TODO
                console.error("Error loading sources!!");
            },
            scope: this
        });

    },

    /**
     * private: method[initCapGridFromSourceAndData]
     * Constructs a window with a capabilities grid.
     */
    initCapGridFromSourceAndData: function(data, sources, target) {

        var expander = this.createExpander();

        function addLayers() {
            var source = this.selectedSource;
            var records = capGridPanel.getSelectionModel().getSelections();
            var recordsToAdd = [],
                numRecords = records.length;

            function collectRecords(record) {
                if (recordsToAdd) {
                    recordsToAdd.push(record);
                }
                numRecords--;
                if (numRecords === 0) {
                    this.addLayers(recordsToAdd, true);
                    this.capGrid.hide();
                }
            }
            for (var i = 0, ii = records.length; i < ii; ++i) {
                var record = source.createLayerRecord({
                    name: records[i].get("name"),
                    source: source.id
                }, collectRecords, this);
                if (record) {
                    collectRecords.call(this, record);
                }
            }
        }

        var idx = 0;
        if (this.startSourceId !== null) {
            sources.each(function(record) {
                if (record.get("id") === this.startSourceId) {
                    idx = sources.indexOf(record);
                }
            }, this);
        }

        source = this.target.layerSources[data[idx][0]];

        var filters = this.createFilters();
        var capGridPanel = new Ext.grid.GridPanel({
            store: source.store,
            width: 500,
            minSize: 350,
            autoScroll: true,
            autoExpandColumn: "title",
            loadMask: true,
            plugins: [expander, filters],
            colModel: this.createColumnModel(expander),
            listeners: {
                rowdblclick: this.activePreview ? this.mapPreview : addLayers,
                scope: this
            }
        });

        this.capGridPanel = capGridPanel;

        var sourceComboBox = new Ext.form.ComboBox({
            ref: "../sourceComboBox",
            width: 165,
            store: sources,
            valueField: "id",
            displayField: "title",
            tpl: '<tpl for="."><div ext:qtip="{url}" class="x-combo-list-item">{title}</div></tpl>',
            triggerAction: "all",
            editable: false,
            allowBlank: false,
            forceSelection: true,
            mode: "local",
            value: data[idx][0],
            listeners: {
                select: this.defaultSourceComboSelect,
                focus: function(field) {
                    if (target.proxy) {
                        field.reset();
                    }
                },
                scope: this
            }
        });

        this.sourceComboBox = sourceComboBox;

        var capGridToolbar = null;
        if (this.target.proxy || data.length > 1) {
            capGridToolbar = [
                new Ext.Toolbar.TextItem({
                    text: this.layerSelectionText
                }),
                sourceComboBox
            ];
        }

        if (this.target.proxy) {
            this.addServerId = Ext.id();
            sources.loadData([
                [this.addServerId, this.addServerText + "..."]
            ], true);
        }

        var newSourceDialog = {
            xtype: "pgeo_newsourcedialog",
            header: false,
            target: this.target,
            invalidURLText: this.invalidWMSURLText,
            storedSources: this.storedSources,
            onUrlSaved: function(source) {
                var storedRecord = new this.storedSources.recordType({
                    id: source.id,
                    title: source.name,
                    url: source.url
                });
                this.storedSources.insert(0, [storedRecord]);
                this.hide();
            },
            listeners: {
                "hide": function(cmp) {
                    if (!this.outputTarget) {
                        cmp.ownerCt.hide();
                    }
                },
                "urlselected": function(newSourceDialog, url) {
                    newSourceDialog.setLoading();

                    this.target.addLayerSource({
                        config: {
                            url: url
                        }, // assumes default of gx_wmssource
                        callback: function(id) {
                            // add to combo and select
                            var record = new sources.recordType({
                                id: id,
                                title: this.target.layerSources[id].title || this.untitledText
                            });
                            sources.insert(0, [record]);
                            sourceComboBox.onSelect(record, 0);
                            newSourceDialog.hide();
                        },
                        fallback: function(source, msg) {
                            newSourceDialog.setError(
                                new Ext.Template(this.addLayerSourceErrorText).apply({
                                msg: msg
                            }));
                        },
                        scope: this
                    });
                },
                scope: this
            }
        };

        this.newSourceDialog = newSourceDialog;

        var me = this;

        function showNewSourceDialog() {
            me.showNewSourceDialog();
        }


        var items = {
            xtype: "container",
            region: "center",
            layout: "fit",
            hideBorders: true,
            items: [capGridPanel]
        };
        if (this.instructionsText) {
            items.items.push({
                xtype: "box",
                autoHeight: true,
                autoEl: {
                    tag: "p",
                    cls: "x-form-item",
                    style: "padding-left: 5px; padding-right: 5px"
                },
                html: this.instructionsText
            });
        }

        var bbarItems = [this.createBbarItems(capGridPanel, filters, addLayers)];

        var uploadButton;
        if (!this.uploadSource) {
            uploadButton = this.createUploadButton();
            if (uploadButton) {
                bbarItems.unshift(uploadButton);
            }
        }

        var Cls = this.outputTarget ? Ext.Panel : Ext.Window;
        this.capGrid = new Cls(Ext.apply({
            title: this.availableLayersText,
            closeAction: "hide",
            layout: "border",
            height: this.height,
            width: this.width,
            modal: true,
            items: items,
            tbar: capGridToolbar,
            bbar: bbarItems,
            listeners: {
                hide: function(win) {
                    capGridPanel.getSelectionModel().clearSelections();
                },
                show: function(win) {
                    if (this.selectedSource === null) {
                        this.setSelectedSource(this.target.layerSources[data[idx][0]]);
                    } else {
                        this.setSelectedSource(this.selectedSource);
                    }
                },
                scope: this
            }
        }, this.initialConfig.outputConfig));
        if (Cls === Ext.Panel) {
            this.addOutput(this.capGrid);
        }

    },

    showNewSourceDialog: function() {
        if (this.outputTarget) {
            this.addOutput(this.newSourceDialog);
        } else {
            new Ext.Window({
                title: gxp.NewSourceDialog.prototype.title,
                modal: true,
                hideBorders: true,
                width: 300,
                items: this.newSourceDialog
            }).show();
        }
    },

    defaultSourceComboSelect: function(combo, record, index) {
        var id = record.get("id");
        if (id === this.addServerId) {
            this.showNewSourceDialog();
            this.sourceComboBox.reset();
            return;
        }
        var source = this.target.layerSources[id];
        this.capGridPanel.reconfigure(source.store, this.capGridPanel.getColumnModel());
        // TODO: remove the following when this Ext issue is addressed
        // http://www.extjs.com/forum/showthread.php?100345-GridPanel-reconfigure-should-refocus-view-to-correct-scroller-height&p=471843
        this.capGridPanel.getView().focusRow(0);
        this.setSelectedSource(source);
        // blur the combo box
        //TODO Investigate if there is a more elegant way to do this.
        (function() {
            combo.triggerBlur();
            combo.el.blur();
        }).defer(100);
    },

    createBbarItems: function(capGridPanel, filters, addLayers) {
        var defaultBbar = ["->",
            new Ext.Button({
                text: this.onlyCompatibleText,
                iconCls: "gxp-icon-filter",
                enableToggle: true,
                handler: function(button, state) {
                    this.filterCapaGrid(button, state, capGridPanel, filters);
                },
                scope: this
            }),
            new Ext.Button({
                text: this.addButtonText,
                iconCls: "gxp-icon-addlayers",
                handler: addLayers,
                scope: this
            }),
            new Ext.Button({
                text: this.doneText,
                handler: function() {
                    this.capGrid.hide();
                },
                scope: this
            })
        ];
        var isAuthorized = this.target.isAuthorizedIn("ROLE_ADMINISTRATOR");
        if (isAuthorized) {
            defaultBbar.push(this.obtainAdminBbar());
            return defaultBbar;
        } else {
            return defaultBbar;
        }
    },

    /**
     * Method:[obtainAdminBbar]
     *
     * Obtain extra buttons for admin user logged
     **/
    obtainAdminBbar: function() {
        var items = new Array();
        if ( !! this.storedSources && !! this.storedSources.data) {

            var deleteButton = new Ext.Button({
                text: this.removeText,
                title: this.removeTitleText,
                disabled: true,
                handler: function() {
                    var id = this._deleteButtonConfig.id,
                        name = this._deleteButtonConfig.name;
                    if (this.verboseRemove) {
                        Ext.Msg.confirm(this.removeSourceWindowTitleText, String.format(this.removeSourceWindowText, name, id), this.removeLayerSourceConfirm, this);
                    } else {
                        this.removeLayerSource(id);
                    }
                },
                scope: this
            });
            this.sourceComboBox.addListener('select', function(combo, record, index) {
                var id = null;
                var name = null;
                var url = null;
                var wmsSourceId = record.get('id');
                storedSourceSelected = null;
                for (var i = 0; i < this.storedSources.data.length; i++) {
                    if (this.selectedSource.url == this.storedSources.data.get(i).get('url')) {
                        id = this.storedSources.data.get(i).get('id');
                        name = this.storedSources.data.get(i).get('title');
                        url = this.storedSources.data.get(i).get('url');
                        storedSourceSelected = this.storedSources.data.get(i);
                        break;
                    }
                }
                this._deleteButtonConfig = {
                    id: id,
                    name: name,
                    url: url,
                    wmsSourceId: wmsSourceId,
                    deleteableRecord: record,
                    storedSourceSelected: storedSourceSelected
                };
                if ( !! id && !! name) {
                    deleteButton.setDisabled(false);
                } else {
                    deleteButton.setDisabled(true);
                }
                //this.defaultSourceComboSelect(combo, record, index);
            }, this);
            items.push(deleteButton);
        }
        return items;
    },

    removeLayerSourceConfirm: function(btn) {
        if (btn == 'yes') {
            this.removeLayerSource(this._deleteButtonConfig.id);
        }
    },

    removeLayerSource: function(id) {
        Ext.Ajax.request({
            url: this.target.defaultRestUrl + '/persistenceGeo/deleteSourceTool/' + id,
            method: 'POST',
            success: function(response) {
                this.sourceComboBox.store.remove(this._deleteButtonConfig.deleteableRecord);
                this.storedSources.remove(this._deleteButtonConfig.storedSourceSelected);
                this.sourceComboBox.onSelect(this.sourceComboBox.store.getAt(0), 0);
            },
            failure: function(response) {
                //TODO
                console.error("Error removing source!!");
            },
            scope: this
        });
    },

    filterCapaGrid: function(button, state, capGridPanel, filters) {
        var store = capGridPanel.getStore();
        if ( !! store.url) {
            // only filter wms!!
            var filter = (filters.filter === true) ? false : true;
            filters.filter = filter;
            var srs_filter = filters.filters.get("srs");
            var srsMap = this.target.mapPanel.map.projection;
            if (filter) {
                srs_filter.setValue(srsMap);
            } else {
                srs_filter.setValue('');
            }
            store.reload();
        }
    },

    createFilters: function() {
        this.filters = new Ext.ux.grid.GridFilters({
            // encode and local configuration options defined previously for easier reuse
            encode: false, // json encode the filter query
            local: true, // defaults to false (remote filtering)
            filters: [{
                    type: 'string',
                    dataIndex: 'title',
                    disabled: false
                }, {
                    type: 'string',
                    dataIndex: 'name',
                    disabled: false
                }, {
                    type: 'map',
                    dataIndex: 'srs',
                    disabled: false
                }
            ]
        });

        return this.filters;
    },

    createColumnModel: function(expander) {
        return new Ext.grid.ColumnModel([
            expander, {
                id: "title",
                header: this.panelTitleText,
                dataIndex: "title",
                sortable: true
            }, {
                header: "Id",
                dataIndex: "name",
                width: 120,
                sortable: true
            }, {
                header: this.panelSRSText,
                dataIndex: "srs",
                width: 70,
                sortable: true,
                hidden: true,
                renderer: function(data) {
                    var srs = "<ul>";
                    for (var code in data) {
                        srs += "<li>" + code + "</li>";
                    }
                    srs += "</ul>";
                    return srs;
                },
                filter: {
                    type: 'map'
                    // specify disabled to disable the filter menu
                    //, disabled: true
                }
            }
        ]);
    },

    /**
     * Method: mapPreview
     *
     * Shows map preview of a layer
     *
     * Parameters
     *  grid - <Ext.grid.GridPanel> grid with layers information
     *  index - <Integer> with layer index to load
     */
    mapPreview: function(grid, index) {
        var record = grid.getStore().getAt(index);
        var layer;

        layer = record.getLayer();
        /**
         * TODO: The WMSCapabilitiesReader should allow for creation
         * of layers in different SRS.
         */
        if (layer instanceof OpenLayers.Layer.WMS) {
            layer = new OpenLayers.Layer.WMS(
                layer.name, layer.url, {
                layers: layer.params["LAYERS"]
            }, {
                attribution: layer.attribution,
                maxExtent: OpenLayers.Bounds.fromArray(
                    record.get("llbbox")),
                //                    .transform(
                //                        new OpenLayers.Projection(Viewer.GEO_PROJECTION),
                //                        this.mapPanel.map.getProjectionObject()
                //                    )
                isBaseLayer: false //Default overlay
            });
        }

        var win = new Ext.Window({
            title: String.format(this.previewLayerText, record.get("title")),
            width: this.prewievWidth,
            height: this.previewHeight,
            layout: "fit",
            items: [{
                    xtype: "gx_mappanel",
                    layers: [layer],
                    extent: record.get("llbbox")
                }
            ]
        });
        win.show();
    },

    createTemporaryLayer: function() {

        var Dialog = Ext.extend(Ext.Window, {
            parentAction: null,

            constructor: function(config) {

                Dialog.superclass.constructor.call(this, Ext.apply({
                    title: config.parentAction.tempLayerWindowTitleText,
                    width: 400,
                    height: 200,
                    layout: 'fit'
                }, config));

                this.on({
                    beforerender: this.onBeforeRender,
                    scope: this
                });
            },

            onCancelButtonClicked: function(button, evt) {
                this.close();
            },

            onAddButtonClicked: function(button, evt) {
                var geometry = this.radioGroup.getValue().getGroupValue();
                var name = this.txtName.getValue();
                var form = this.getComponent('formNewLayer').getForm();
                if (!form.isValid()) {
                    return;
                }

                Ext.Msg.wait(this.parentAction.waitText);
                form.submit({
                    scope: this,
                    url: '../../vectorialLayerController/newTempLayer',
                    waitMsg: this.createLayerWaitMsgText,
                    waitTitle: this.createLayerWaitMsgTitleText,
                    success: function(fp, o) {
                        Ext.Msg.updateProgress(1);
                        Ext.Msg.hide();
                        var resp = Ext.util.JSON.decode(o.response.responseText);
                        if (resp && resp.success && resp.data && resp.data.status === "success") {
                            //Add layer to map and close window
                            var layerName = resp.data.layerName;
                            var layerTitle = resp.data.layerTitle;
                            var geoserverUrl = (resp.data.serverUrl) || (app.sources.local.url + "/wms");
                            var layer = new OpenLayers.Layer.WMS(layerTitle,
                                geoserverUrl, {
                                layers: layerName,
                                transparent: true
                            }, {
                                opacity: 1,
                                visibility: true
                            });
                            layer.metadata.layerResourceId = resp.data.layerResourceId;
                            layer.metadata.layerTypeId = resp.data.layerTypeId;
                            layer.metadata.temporal = true;
                            Viewer.getMapPanel().map.addLayer(layer);
                            this.close();
                            Ext.Msg.alert('Capa creada', "La capa se ha creado de forma temporal");
                        } else if (resp && resp.success && resp.data && resp.data.status === "error") {
                            Ext.Msg.alert('Error', resp.data.message);
                        } else {
                            Ext.Msg.alert('Error', "Se ha producido un error creando la capa.");
                        }
                    },
                    failure: function(form, action) {
                        Ext.Msg.updateProgress(1);
                        Ext.Msg.hide();
                        Ext.Msg.alert('Error', "Se ha producido un error al enviar los datos al servidor");
                    }
                });
            },

            onBeforeRender: function() {
                this.add({
                    xtype: 'form',
                    layout: 'form',
                    itemId: 'formNewLayer',
                    padding: 10,
                    items: [{
                            xtype: 'label',
                            cls: 'toolDescription',
                            text: this.parentAction.tempLayerDescriptionText
                        },
                        this.radioGroup = new Ext.form.RadioGroup({
                            items: [
                                new Ext.form.Radio({
                                    boxLabel: this.parentAction.tempLayerPointText,
                                    name: 'geometryType',
                                    inputValue: 'POINT',
                                    checked: true
                                }),
                                new Ext.form.Radio({
                                    boxLabel: this.parentAction.tempLayerLineText,
                                    name: 'geometryType',
                                    inputValue: 'LINESTRING'
                                }),
                                new Ext.form.Radio({
                                    boxLabel: this.parentAction.tempLayerPolygonText,
                                    name: 'geometryType',
                                    inputValue: 'POLYGON'
                                })
                            ],
                            fieldLabel: "Tipo de geometría"
                        }),
                        this.txtName = new Ext.form.TextField({
                            fieldLabel: this.parentAction.tempLayerNameLabelText,
                            name: 'layerName',
                            anchor: '95%',
                            allowBlank: false,
                            blankText: this.parentAction.nameBlankText,
                            listeners: {
                                valid: function() {
                                    this.btnAdd.setDisabled(false);
                                },
                                invalid: function() {
                                    this.btnAdd.setDisabled(true);
                                },
                                scope: this
                            }
                        })
                    ],
                    buttons: [
                        this.btnAdd = new Ext.Button({
                            text: this.parentAction.tempLayerCreateButtonText,
                            listeners: {
                                click: this.onAddButtonClicked,
                                scope: this
                            }
                        }),
                        this.btnCancel = new Ext.Button({
                            text: this.parentAction.tempLayerCancelButtonText,
                            listeners: {
                                click: this.onCancelButtonClicked,
                                scope: this
                            }
                        })
                    ]
                });
            }
        });

        var dialog = new Dialog({
            mapPanel: this.target.mapPanel,
            parentAction: this
        });
        dialog.show();
    }

});

Ext.preg(Viewer.plugins.AddLayers.prototype.ptype, Viewer.plugins.AddLayers);