/**
 * Copyright (c) 2009-2010 The Open Planning Project
 *
 * @requires GeoExplorer.js
 */

/** api: (define)
 *  module = GeoExplorer
 *  class = GeoExplorer.Composer(config)
 *  extends = GeoExplorer
 */

/** api: constructor
 *  .. class:: GeoExplorer.Composer(config)
 *
 *      Create a GeoExplorer application intended for full-screen display.
 */
PersistenceGeo.Composer = Ext.extend(GeoExplorer, {

    /** api: config[cookieParamName]
     *  ``String`` The name of the cookie parameter to use for storing the
     *  logged in user.
     */
    cookieParamName: 'geoexplorer-user',

    // Begin i18n.
    mapText: "Map",
    saveMapText: "Save map",
    exportMapText: "Export map",
    toolsTitle: "Choose tools to include in the toolbar:",
    previewText: "Preview",
    backText: "Back",
    nextText: "Next",
    loginText: "Login",
    logoutText: "Logout, {user}",
    loginErrorText: "Invalid username or password.",
    userFieldText: "User",
    passwordFieldText: "Password",
    saveErrorText: "Trouble saving: ",
    tableText: "Table",
    queryText: "Query",
    /* Edición */
    tooltipEdition: "Edition tools",
    // End i18n.
    itemsActivateToGeoserverArray: [],
    itemsActivateToLayerID: [],
    defaultRestUrl: "/sig-minen/rest",
    //defaultRestUrl: "http://localhost:8080/sig-minen/rest",
    loginUrl: "/sig-minen/j_spring_security_check",
    logoutUrl: "/sig-minen/logout",
    adminUrl: '../../controlUsuarioLogado',

    /** 
     * Base layers names: May be the same than defined in composer.html!!
     **/
    baseLayers: ["OpenStreetMap", "Google Satellite","Google Terrain"],

    loginWindow: null,

    /** To be applied in Ext.Window **/
    constrainHeader: true,

    /** To be applied in Ext.Window **/
    minimizable: true,

    constructor: function(config) {
        // Now handled in LoginWindow!!!
        this.authorizedRoles = [];
        // // Starting with this.authorizedRoles being undefined, which means no
        // // authentication service is available
        // if (config.authStatus === 401) {
        //     // user has not authenticated or is not authorized
        //     this.authorizedRoles = [];
        // } else if (config.authStatus !== 404) {
        //     // user has authenticated
        //     this.authorizedRoles = ["ROLE_ADMINISTRATOR"];
        // }
        // should not be persisted or accessed again
        delete config.authStatus;

        /**
         *  Here common config tools!!!
         **/
        this.defaultTools = [{
            ptype: "pgeo_layermanager",
            id: "layermanager",
            outputConfig: {
                id: "layers",
                tbar: [],
                bbar: [],
                autoScroll: true
            },
            outputTarget: "tree"
        }, {
            ptype: "pgeo_removelayer",
            actionTarget: ["layers.contextMenu"]
        }, {
            ptype: "pgeo_layeropacityslider",
            actionTarget: ["layers.contextMenu"]
        }, {
            ptype: "pgeo_makelayerpersistent",
            actionTarget: ["layers.contextMenu"]
        }, {
            ptype: "vw_layerproperties",
            id: "layerproperties",
            outputConfig: {
                defaults: {
                    autoScroll: true
                },
                width: 320
            },
            actionTarget: ["layers.contextMenu"],
            outputTarget: "tree"
        }, {
            ptype: "vw_styler",
            id: "styler",
            sameOriginStyling: false,
            outputConfig: {
                autoScroll: true,
                width: 480
            },
            actionTarget: ["layers.contextMenu"],
            outputTarget: null
        }, {
            ptype: "vw_exporttoshp",
            id: "exportshp",
            actionTarget: ["layers.contextMenu"],
            requireLogin: true
        }, {
            ptype: "vw_exporttokml",
            id: "exportkml",
            actionTarget: ["layers.contextMenu"]
        }, {
            ptype: 'gxp_metadatainformation',
            id: 'metadatainformation',
            actionTarget: ['layers.contextMenu']
        },{
            ptype: 'gxp_loadadditionallayers',
            actionTarget: "layers.bbar",
            outputTarget: null,
            showButtonText: true
        }, {
            ptype: "pgeo_zoomtolayerextent",
            actionTarget: {
                target: "layers.contextMenu",
                index: 0
            }
        }, {
            ptype: "gxp_pdfprint",
            showButtonText: false,
            actionTarget: "map.tbar",
            toggleGroup: "globalToggle",
            pdfLogoUri: "http://sig.minenergia.cl/sig-minen/moduloCartografico/theme/app/img/logo_ministerio.png"
        }, {
            ptype: "gxp_zoomtoinitialvalues",
            id: "zoomToInitialValues"
        }, {
            ptype: 'gxp_customzoom',
            toggleGroup: 'globalToggle',
            showZoomBoxAction: true,
            controlOptions: {
                zoomOnClick: false
            }
        }, {
            ptype: "gxp_navigationhistory"
        }, {
            ptype: "gxp_pancontrol"
        }, {
            ptype: 'gxp_extendedtoolbar',
            buttonText: 'Información',
            menuText: 'Información',
            tooltip: 'Información',
            iconCls: 'vw-icon-information-toolbar',
            toolbar: 'InformationToolbar',
            targetParent: this
        }, {
            ptype: 'gxp_extendedtoolbar',
            id: 'editiontbar',
            buttonText: 'Edición',
            menuText: 'Edición',
            tooltip: this.tooltipEdition,
            iconCls: 'vw-icon-edition',
            toolbar: 'EditionToolbar'
        }, {
            ptype: "vw_addlayers",
            actionTarget: "map.tbar",
            outputTarget: false,
            height: 500,
            width: 500,
            uploadSource: "local"
        }, {
            ptype: 'gxp_extendedtoolbar',
            buttonText: 'Exportar',
            menuText: 'Exportar',
            tooltip: 'Exportar',
            iconCls: 'vw-icon-importexport-toolbar',
            toolbar: 'ImportExportToolbar'
        },{
            ptype: 'vw_wmsgetfeatureinfo',
            format: 'grid',
            showButtonText: false,
            infoActionTip: 'Información de elementos',
            popupTitle: 'Información de elementos',
            buttonText: 'Información de elementos',
            actionTarget: "map.tbar"
        }, {
            ptype: "gxp_channeltools",
            actionTarget: "layers.tbar",
            showButtonText: true,
            outputTarget: false,
            track: false,
            showZones: false
        }, {
            ptype: "pgeo_featuremanager",
            id: "querymanager",
            selectStyle: {
                cursor: ''
            },
            autoLoadFeatures: true,
            maxFeatures: 50,
            paging: true,
            pagingType: gxp.plugins.FeatureManager.WFS_PAGING
        }, {
            ptype: "gxp_featuregrid",
            featureManager: "querymanager",
            id: 'featuregridtool',
            showTotalResults: true,
            autoLoadFeature: false,
            alwaysDisplayOnMap: true,
            controlOptions: {
                multiple: true
            },
            displayMode: "selected",
            outputTarget: "table",
            outputConfig: {
                id: "featuregrid",
                columnsSortable: true
            }
        }, {
            ptype: "gxp_zoomtoselectedfeatures",
            featureManager: "querymanager",
            actionTarget: ["featuregrid.contextMenu", "featuregrid.bbar"]

        }, {
            ptype: "pgeo_featuremanager",
            id: "featuremanager",
            maxFeatures: 20,
            paging: false
        }];

        /**
         *  Here common last config tools (loginbutton and header)!!!
         **/
        this.defaultLastTools = [{
            actions: ["loginbutton", "toggleheader"]
        }];

        config.tools = this.finalTools(config);        

        // write this.defaultLastTools
        for(var i = 0 ; i< this.defaultLastTools.length ; i++){
            config.tools.push(this.defaultLastTools[i]);
        }

        this.loginWindow = new PersistenceGeo.widgets.LoginWindow({
            target: this,
            defaultRestUrl: this.defaultRestUrl,
            loginUrl: this.loginUrl,
            logoutUrl: this.logoutUrl,
            loginText: this.loginText,
            logoutText: this.logoutText,
            loginErrorText: this.loginErrorText,
            userFieldText: this.userFieldText,
            passwordFieldText: this.passwordFieldText,
            saveErrorText: this.saveErrorText,
            id: "loginDialog"
        });

        PersistenceGeo.Composer.superclass.constructor.apply(this, arguments);
    },

    /** private: method[finalTools]
     *  Obtain final tools to be used in composer. 
     *  If you want to force overwrite config you must return a simple array in this method.
     */
    finalTools: function (config){
        var newTools = this.defaultTools;
        if(!!config.tools){
            for(var i = 0 ; i< config.tools.length ; i++){
                if(!config.tools[i].before){
                    newTools.push(config.tools[i]);
                }else{
                    newTools = this.reOrderConfig(config.tools[i], newTools);
                }
            }
        }
        return newTools;
    },

    /** private: method[reOrderConfig]
     *  Reorder tools config with 'before' config
     */
    reOrderConfig: function (newTool, newTools){
        var beforeConfig = newTool.before;
        var newToolIndex = newTools.length;
        for(var i = 0 ; i< newTools.length ; i++){
            var found = true;
            for(var key in beforeConfig){
                if(beforeConfig[key] != newTools[i][key]){
                    found = false;
                }
            }
            if(found){
                newToolIndex = i;
                break;
            }
        }
        var previousTool = newTool;
        delete previousTool.before; // not used in final config.
        for(;newToolIndex < newTools.length ; newToolIndex++){
            var tmpPreviousTool = newTools[newToolIndex];
            newTools[newToolIndex] = previousTool;
            previousTool = tmpPreviousTool;
        }
        newTools[newToolIndex] = previousTool;
        return newTools;
    },

    /** private: method[changeBaseLayerProperty]
     *  Change baseLayers property of layers with a name contained
     * in this.baseLayers array.
     */
    changeBaseLayerProperty: function(config) {
        try {
            // console.log("setting base layer");
            // console.log(config);
            // Add isBaseLayer property
            var baseLayerindex = $.inArray(config.layer.name, this.baseLayers);
            if (baseLayerindex > -1) {
                // May been base layer,
                // but actual layer tree and/or configuration
                // do something that does it don't work:
                config.layer.setIsBaseLayer(true);
                if (baseLayerindex === 0) {
                    // set base layer
                    config.object.setBaseLayer(config.layer);
                }
            }
        } catch (e) {
            console.error('Error loading some layer');
        }
    },

    /** private: method[changeBaseLayer]
     *  Called when the map change the base layer. Make it visible.
     */
    changeBaseLayer: function(config) {
        try {
            // console.log("changing base layer");
            // console.log(config);
            var baseLayerindex = $.inArray(config.layer.name, this.baseLayers);
            if (baseLayerindex == -1) {
                // when GeoExplorer try to set another baseLayer
                var selectedBaseLayer = this._lastSelectedBaseLayer || config.object.getLayersByName(this.baseLayers[0])[0];
                if (!!selectedBaseLayer 
                        // && this._lastSelectedBaseLayer !== selectedBaseLayer
                    ) {
                    // set base layer
                    config.object.setBaseLayer(selectedBaseLayer);
                }
            } else {
                // Make visible!!
                this._lastSelectedBaseLayer = config.layer;
                config.layer.setVisibility(true);
            }
        } catch (e) {
            console.error('Error loading changing base layer');
        }
    }, 

    loadConfig: function(config) {
        PersistenceGeo.Composer.superclass.loadConfig.apply(this, arguments);

        var query = Ext.urlDecode(document.location.search.substr(1));
        if (query && query.styler) {
            for (var i = config.map.layers.length - 1; i >= 0; --i) {
                delete config.map.layers[i].selected;
            }
            config.map.layers.push({
                source: "local",
                name: query.styler,
                selected: true,
                bbox: query.lazy && query.bbox ? query.bbox.split(",") : undefined
            });
            this.on('layerselectionchange', function(rec) {
                var styler = this.tools.styler,
                    layer = rec.getLayer(),
                    extent = layer.maxExtent;
                if (extent && !query.bbox) {
                    this.mapPanel.map.zoomToExtent(extent);
                }
                this.doAuthorized(styler.roles, styler.addOutput, styler);
            }, this, {
                single: true
            });
        }

        this.mapPanel.map.events.register('addlayer', this, this.changeBaseLayerProperty, this);
        this.mapPanel.map.events.register('changebaselayer', this, this.changeBaseLayer, this);

        // default is anonymous
        this.anonymousLogin();
        // if can obtain user info, must be logged
        this.obtainUserInfo();

        // window costumization
        this._applyWindowCustomizations();
        // To prevent window sizes to become bigger than the viewable area
        // when the browser size is changed.
        Ext.EventManager.onWindowResize(function() {
            Ext.WindowMgr.each(function(window) {
                window.ensureHeightFits();
            });
        });

        // TODO: Need the correct base layer for the Overview map
        this.mapPanel.map.addControls(this.getAditionalControls());
    },

    getAditionalControls: function(){
        return [
            new OpenLayers.Control.CustomOverviewMap({
                viewFixed: true,
                fixedZoomLevel: 2,
                layers: [new OpenLayers.Layer.WMS(
                        "OpenLayers WMS",
                        "http://vmap0.tiles.osgeo.org/wms/vmap0", {
                        layers: "basic"
                    })]
            })
            ,
            new OpenLayers.Control.CustomMousePosition({
                emptyString: '',
                displayProjection: Viewer.GEO_PROJECTION,
                utmDisplayProjection: Viewer.UTM_PROJECTION
            })
        ];
    },

    /** private: method[authenticate]
     * Show the login dialog for the user to login. Delegated to this.loginWindow.
     */
    authenticate: function() {

        this.loginWindow.show();
    },


    /** private: method[setCookieValue]
     *  Set the value for a cookie parameter. Delegated to this.loginWindow.
     */
    setCookieValue: function(param, value) {
        this.loginWindow.setCookieValue(param, value);
    },

    /** private: method[clearCookieValue]
     *  Clear a certain cookie parameter. Delegated to this.loginWindow.
     */
    clearCookieValue: function(param) {
        this.loginWindow.clearCookieValue(param);
    },

    /** private: method[getCookieValue]
     *  Get the value of a certain cookie parameter. Returns null if not found. Delegated to this.loginWindow.
     */
    getCookieValue: function(param) {
        this.loginWindow.getCookieValue(param);
    },

    /** private: method[logout]
     *  Log out the current user from the application. Delegated to this.loginWindow.
     */
    logout: function() {
        this.loginWindow.logout();
    },

    // Delegated to this.loginWindow.
    closePersistenceGeoContext: function (){
        this.loginWindow.closePersistenceGeoContext();
    },

    // Delegated to this.loginWindow.
    closePersistenceGeoContext: function (){
        this.loginWindow.closePersistenceGeoContext();
    },

    // Delegated to this.loginWindow.
    showLogin: function (){
        this.loginWindow.showLogin();
    },

    // Delegated to this.loginWindow.
    showLogout: function(user) {
        this.loginWindow.showLogout(user);
    },

    /** Method: isAuthorizedIn 
     * Checks if authenticated user has permision for a role. Delegated to this.loginWindow.
     **/
    isAuthorizedIn: function(role) {
        return this.loginWindow.isAuthorizedIn(role);
    },

    /**
     * private: method[applyLoginState]
     * Attach a handler to the login button and set its text. Delegated to this.loginWindow.
     */
    applyLoginState: function(iconCls, text, handler, scope) {
        return this.loginWindow.applyLoginState(iconCls, text, handler, scope);
    },

    doAuthorized: function(roles, callback, scope) {
        this.loginWindow.doAuthorized(roles, callback, scope);
    },

    // obtain user info from action.response.responseText or another request. Delegated to this.loginWindow.
    obtainUserInfo: function(action) {
        this.loginWindow.obtainUserInfo(action);
    },

    /** Method: authorityLogin 
     * Login for an admin of an authorithy.Delegated to this.loginWindow.
     **/
    authorityLogin: function(userInfo) {
        this.loginWindow.authorityLogin(userInfo);
    },

    /** Method: anonymousLogin 
     * Do anonymous login. Delegated to this.loginWindow.
     **/
    anonymousLogin: function(userInfo) {
        this.loginWindow.anonymousLogin(userInfo);
    },

    /** private: method[initPortal]
     * Create the various parts that compose the layout.
     */
    initPortal: function() {

        var westPanel = new gxp.CrumbPanel({
            id: "tree",
            region: "west",
            width: 320,
            split: true,
            collapsible: true,
            collapseMode: "mini",
            hideCollapseTool: true,
            header: false,
            baseCls: "sidebar-left",
            listeners: {
                collapse: function() {
                    // We need to add the tooltip for the expand button here as the button is not created until collapse happens
                    Ext.query("#tree-xcollapsed .x-layout-mini")[0].title = "Mostrar árbol de capas";
                },
                scope: this
            }
        });
        var southPanel = new Ext.Panel({
            region: "south",
            id: "south",
            height: 220,
            border: false,
            split: true,
            collapsible: true,
            collapseMode: "mini",
            collapsed: true,
            hideCollapseTool: true,
            header: false,
            layout: "border",
            items: [{
                    region: "center",
                    id: "table",
                    title: this.tableText,
                    layout: "fit"
                }, {
                    region: "west",
                    width: 320,
                    id: "query",
                    title: this.queryText,
                    split: true,
                    collapsible: true,
                    collapseMode: "mini",
                    collapsed: true,
                    hideCollapseTool: true,
                    layout: "fit"
                }
            ]
        });
        //var toolbar = new Ext.Toolbar({
        //    disabled: true,
        //    id: 'paneltbar',
        //    items: []
        //});
        this.on("ready", function() {
            // enable only those items that were not specifically disabled
            //var disabled = toolbar.items.filterBy(function(item) {
            //    return item.initialConfig && item.initialConfig.disabled;
            //});
            //toolbar.enable();
            //disabled.each(function(item) {
            //    item.disable();
            //});

            // We apply a style to the tools that open toolbars.
            for (var toolName in this.tools) {
                var tool = this.tools[toolName];
                // If the tool doesn't add a toolbar, we do nothing.
                if (tool.toolbar) {
                    var toolButton = tool.actions[0].items[0];
                    toolButton.addClass("vw-icon-toolbar");
                }
            }

            // We handle layer adding after the initial layers are added to the composer.
            // Layers added after this are always removable from the TOC.
            this.mapPanel.map.events.register("addlayer", this, function(event) {
                var layer = event.layer;
                layer.metadata.removable = true;
            });

            // We add tooltips to the expander of the feature grid
            Ext.query("#south-xsplit .x-layout-mini")[0].title = "Ocultar tabla de atributos";
            Ext.query("#south-xcollapsed .x-layout-mini")[0].title = "Mostrar tabla de atributos";

            // We add tooltips to the expander of the layers tree       
            Ext.query("#tree-xsplit .x-layout-mini")[0].title = "Ocultar árbol de capas";

            // We add tooltips to the overview map minimize button collaps olControlOverviewMapMaximizeButton olButton
            Ext.query(".olControlOverviewMapMaximizeButton.olButton")[0].title = "Mostrar vista general";
            Ext.query(".olControlOverviewMapMinimizeButton.olButton")[0].title = "Ocultar vista general";
        });

        var googleEarthPanel = new gxp.GoogleEarthPanel({
            mapPanel: this.mapPanel,
            id: "globe",
            tbar: [],
            listeners: {
                beforeadd: function(record) {
                    return record.get("group") !== "background";
                }
            }
        });

        // TODO: continue making this Google Earth Panel more independent
        // Currently, it's too tightly tied into the viewer.
        // In the meantime, we keep track of all items that the were already
        // disabled when the panel is shown.
        var preGoogleDisabled = [];

        googleEarthPanel.on("show", function() {
            preGoogleDisabled.length = 0;
            //toolbar.items.each(function(item) {
            //    if (item.disabled) {
            //        preGoogleDisabled.push(item);
            //    }
            //});
            //toolbar.disable();
            // loop over all the tools and remove their output
            for (var key in this.tools) {
                var tool = this.tools[key];
                if (tool.outputTarget === "map") {
                    tool.removeOutput();
                }
            }
            var layersContainer = Ext.getCmp("tree");
            var layersToolbar = layersContainer && layersContainer.getTopToolbar();
            if (layersToolbar) {
                layersToolbar.items.each(function(item) {
                    if (item.disabled) {
                        preGoogleDisabled.push(item);
                    }
                });
                layersToolbar.disable();
            }
        }, this);

        googleEarthPanel.on("hide", function() {
            // re-enable all tools
            //toolbar.enable();

            var layersContainer = Ext.getCmp("tree");
            var layersToolbar = layersContainer && layersContainer.getTopToolbar();
            if (layersToolbar) {
                layersToolbar.enable();
            }
            // now go back and disable all things that were disabled previously
            for (var i = 0, ii = preGoogleDisabled.length; i < ii; ++i) {
                preGoogleDisabled[i].disable();
            }

        }, this);

        this.mapPanelContainer = new Ext.Panel({
            layout: "card",
            region: "center",
            defaults: {
                border: false
            },
            items: [
                this.mapPanel,
                googleEarthPanel
            ],
            activeItem: 0
        });

        this.portalItems = [{
            region: "center",
            layout: "border",
            //tbar: toolbar,
            items: [
                this.mapPanelContainer,
                westPanel,
                southPanel,
                {
                   region: 'north',
                    id: 'viewer-header',
                    cls: 'viewer-header',
                    collapsible: false,
                    height: 100,
                    layout: 'fit',
                    html: '<div id="responsive-wrap">' +
                        '<div id="logo" class="span-4">' +
                        '<a href="' + this.adminUrl + '" title="Inicio" class="logo-chile">' +
                        '<img src="../theme/app/img/logo_ministerio.png" alt="Ministerio de Energía" />' +
                        '</a>' +
                        '</div>' +
                        '<img src="../theme/app/img/img_cabecera.jpg" alt="Imagen de fondo de la cabecera" class="banner" />' +
                        '</div><!-- /#responsive-wrap -->'
                }
            ]
        }, 
        {
            region: 'south',
            id: 'viewer-footer',
            cls: 'viewer-footer',
            height: 60,
            layout: 'fit',
            html: '<div id="footer">' +
            '<div class="span-24">' +
            '<a href="../../contacto/nuevoContacto"  target="_blank" style="text-decoration: none;cursor:pointer;">Contacto</a>' +
            ' | <a href="../../faq/faqs" style="text-decoration: none;cursor:pointer;">Preguntas frecuentes</a>' +
            '</div>' +    
            '<div class="span-24" style="padding-bottom: 30px">' +
            '<p><strong>Ministerio de Energ&iacute;a. Gobierno de Chile</strong></p>' +
            '</div>' +
            '</div>'
        }];
        
        PersistenceGeo.Composer.superclass.initPortal.apply(this, arguments);        
    },

    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        PersistenceGeo.Composer.superclass.createTools.apply(this, arguments);

        new Ext.Button({
            id: "loginbutton"
        });

        if (this.authorizedRoles) {
            // unauthorized, show login button
            if (this.authorizedRoles.length === 0) {
                this.showLogin();
            } else {
                var user = this.getCookieValue(this.cookieParamName);
                if (user === null) {
                    user = "unknown";
                }
                this.showLogout(user);
            }
        }

        new Ext.Button({
            id: "mapmenu",
            text: this.mapText,
            iconCls: 'icon-map',
            menu: new Ext.menu.Menu({
                items: [{
                    text: this.exportMapText,
                    handler: function() {
                        this.doAuthorized(["ROLE_ADMINISTRATOR"], function() {
                            this.save(this.showEmbedWindow);
                        }, this);
                    },
                    scope: this,
                    iconCls: 'icon-export'
                }, {
                    text: this.saveMapText,
                    handler: function() {
                        this.doAuthorized(["ROLE_ADMINISTRATOR"], function() {
                            this.save(this.showUrl);
                        }, this);
                    },
                    scope: this,
                    iconCls: "icon-save"
                }]
            })            
        });

        new Ext.Button({
            id: "toggleheader",
            iconCls: "x-tool x-tool-maximize",
            tooltip: "Click para ocultar la cabecera",
            listeners: {
                click: this._toggleHeader,
                scope: this
            }
        });

    },

    _toggleHeader: function() {
        var header = Ext.getCmp("viewer-header");
        var button = Ext.getCmp("toggleheader");

        header.toggleCollapse(true);

        var iconCls = !header.collapsed?"x-tool-restore":"x-tool-maximize";
        var tooltip = !header.collapsed?"Click para mostrar la cabecera":"Click para ocultar la cabecera";
        button.setTooltip(tooltip);
        button.setIconClass("x-tool " + iconCls);
    },

    /** private: method[openPreview]
     */
    openPreview: function(embedMap) {
        var preview = new Ext.Window({
            title: this.previewText,
            layout: "fit",
            resizable: false,
            items: [{
                    border: false,
                    html: embedMap.getIframeHTML()
                }
            ]
        });
        preview.show();
        var body = preview.items.get(0).body;
        var iframe = body.dom.firstChild;
        var loading = new Ext.LoadMask(body);
        loading.show();
        Ext.get(iframe).on('load', function() {
            loading.hide();
        });
    },

    /** private: method[save]
     *
     * Saves the map config and displays the URL in a window.
     */
    save: function(callback, scope) {
        var configStr = Ext.util.JSON.encode(this.getState());
        var method, url;
        if (this.id) {
            method = "PUT";
            url = "../maps/" + this.id;
        } else {
            method = "POST";
            url = "../maps/";
        }
        OpenLayers.Request.issue({
            method: method,
            url: url,
            data: configStr,
            callback: function(request) {
                this.handleSave(request);
                if (callback) {
                    callback.call(scope || this);
                }
            },
            scope: this
        });
    },

    /** private: method[handleSave]
     *  :arg: ``XMLHttpRequest``
     */
    handleSave: function(request) {
        if (request.status == 200) {
            var config = Ext.util.JSON.decode(request.responseText);
            var mapId = config.id;
            if (mapId) {
                this.id = mapId;
                window.location.hash = "#maps/" + mapId;
            }
        } else {
            throw this.saveErrorText + request.responseText;
        }
    },

    /** private: method[showEmbedWindow]
     */
    showEmbedWindow: function() {
        var toolsArea = new Ext.tree.TreePanel({
            title: this.toolsTitle,
            autoScroll: true,
            root: {
                nodeType: 'async',
                expanded: true,
                children: this.viewerTools
            },
            rootVisible: false,
            id: 'geobuilder-0'
        });

        var previousNext = function(incr) {
            var l = Ext.getCmp('geobuilder-wizard-panel').getLayout();
            var i = l.activeItem.id.split('geobuilder-')[1];
            var next = parseInt(i, 10) + incr;
            l.setActiveItem(next);
            Ext.getCmp('wizard-prev').setDisabled(next == 0);
            Ext.getCmp('wizard-next').setDisabled(next == 1);
            if (incr == 1) {
                this.save();
            }
        };

       var embedMap = new gxp.EmbedMapDialog({
           id: 'geobuilder-1',
           url: "../viewer/#maps/" + this.id
       });

       var wizard = {
           id: 'geobuilder-wizard-panel',
           border: false,
           layout: 'card',
           activeItem: 0,
           defaults: {border: false, hideMode: 'offsets'},
           bbar: [{
               id: 'preview',
               text: this.previewText,
               handler: function() {
                   this.save(this.openPreview.createDelegate(this, [embedMap]));
               },
               scope: this
           }, '->', {
               id: 'wizard-prev',
               text: this.backText,
               handler: previousNext.createDelegate(this, [-1]),
               scope: this,
               disabled: true
           },{
               id: 'wizard-next',
               text: this.nextText,
               handler: previousNext.createDelegate(this, [1]),
               scope: this
           }],
           items: [toolsArea, embedMap]
       };

       new Ext.Window({
            layout: 'fit',
            width: 500,
            height: 300,
            title: this.exportMapText,
            items: [wizard]
        }).show();
    },



    /** api:method[getSource]
     *  :arg layerRec: ``GeoExt.data.LayerRecord`` the layer to get the
     *      source for.
     */
    getSource: function(layerRec) {

        var source = PersistenceGeo.Composer.superclass.getSource.apply(this, arguments);

        // #78426: Obtain layerSource from layer.source
        if(!source 
            && !!layerRec.get('layer')
            && !!layerRec.get('layer').source){
            var layer = layerRec.get('layer');
            source = layer.source;
        }

        return source;
    },

    /**
     * Overrides some default behaviours of Ext.Window so we can minimize windows
     * and ensure the windows height don't exceed the browser's avalaible area.
     */
    _applyWindowCustomizations: function() {
        // To prevent window titles from being outside the browser view
        Ext.Window.prototype.constrainHeader = this.constrainHeader;
        Ext.Window.prototype.minimizable = this.minimizable;


        // We override Ext.Window to add functionality.
        Ext.override(Ext.Window, {

            // DONT OVERRIDE THIS METHOD! HANDLE SHOW EVENT INSTEAD IN DERIVED CLASSES!!!!
            onShow: function() {
                // We ensure that the window fits the browser area when its show.
                this.ensureHeightFits();

                if (this.minimized) {
                    this._doRestoration();
                } else if (this.maximized) {
                    // Something breaks the positioning after a while...
                    var self = this;
                    setTimeout(function() {
                        self.center();
                    }, 100);
                }


                this.on('beforehide', this._onBeforeHide, this);
            },

            _onBeforeHide: function() {
                if (this.minimized) {
                    this._removeFromMinimized();
                }
            },

            _doMinimization: function() {
                this._restoreResizable = this.resizable;
                this.resizer.resizeTo(250, 20);
                this.resizable = false;

                this.minimized = true;

                // We don't want the user to move minimized windows
                this.dd.lock();
                this.header.removeClass('x-window-draggable');

                // Tools are hidden so we don't get conflicting behaviours.
                if (this.maximized) {
                    this.tools.restore.hide();
                }

                if (this.maximizable) {
                    this.tools.maximize.hide();
                }

                if (!this.manager._minimizedWindows) {
                    this.manager._minimizedWindows = [];
                }


                var xOffset = 260 * this.manager._minimizedWindows.length;
                this.manager._minimizedWindows.push(this);
                // I don't know why but the double 'bl' is required to work. DONOT REMOVE!
                this.anchorTo(document.body, 'bl-bl', [xOffset, -5]);

                this.addClass('x-window-minimized');
            },

            _doRestoration: function() {
                // Tools are shown again
                if (this.maximized) {

                    this.tools.restore.show();
                } else if (this.maximizable) {
                    this.tools.maximize.show();
                }

                this.minimized = false;

                this.resizer.resizeTo();

                this.resizable = this._restoreResizable;
                if (this.draggable && !this.minimized) {
                    this.dd.unlock();
                }

                this.center();
                this.ensureHeightFits();

                this._removeFromMinimized();

                this.removeClass('x-window-minimized');
            },

            _removeFromMinimized: function() {
                // We remove the window from the minimized window list,
                // and reposition the remaining windows.
                this.manager._minimizedWindows.remove(this);
                for (var i = 0; i < this.manager._minimizedWindows.length; i++) {
                    var w = this.manager._minimizedWindows[i];

                    var xOffset = 260 * i;
                    // I don't know why but the double 'bl' is required. DO NOT REMOVE!
                    w.anchorTo(document.body, 'bl-bl', [xOffset, -5]);
                }
            },

            minimize: function() {
                this.toggleCollapse(false);


                var self = this;
                setTimeout(function() {
                    if (self.collapsed) {
                        self._doMinimization();
                    } else {

                        self._doRestoration();
                    }
                }, 251);
            },

            // This method ensures that the window will fit in the browser area
            // by resizing it and centering in the view if necessary.
            ensureHeightFits: function() {
                // We force children
                var domEl = this.el.dom;
                var viewableHeight = $('body')[0].clientHeight;
                if (this.resizer && viewableHeight < domEl.offsetHeight) {
                    this.resizer.resizeTo(domEl.offsetWidth, viewableHeight - 10);

                    this.center();
                    this.syncSize();

                    // The height of the window element is set by the previous call.
                    // We need put it to auto so the window can be manually resized later.
                    Ext.get(domEl).setStyle('height', 'auto');
                }

            }
        });
    },

    _formatLatLongFunction: function(coordinate, axis, dmsOption) {
        if (!dmsOption) {
            dmsOption = 'dms'; //default to show degree, minutes, seconds
        }

        coordinate = (coordinate + 540) % 360 - 180; // normalize for sphere being round

        var abscoordinate = Math.abs(coordinate);
        var coordinatedegrees = Math.floor(abscoordinate);

        var coordinateminutes = (abscoordinate - coordinatedegrees) / (1 / 60);
        var tempcoordinateminutes = coordinateminutes;
        coordinateminutes = Math.floor(coordinateminutes);
        var coordinateseconds = (tempcoordinateminutes - coordinateminutes) / (1 / 60);
        coordinateseconds = Math.round(coordinateseconds * 10);
        coordinateseconds /= 10;

        if (coordinateseconds >= 60) {
            coordinateseconds -= 60;
            coordinateminutes += 1;
            if (coordinateminutes >= 60) {
                coordinateminutes -= 60;
                coordinatedegrees += 1;
            }
        }

        if (coordinatedegrees < 10) {
            coordinatedegrees = '0' + coordinatedegrees;
        }
        var str = coordinatedegrees + '°';

        if (dmsOption.indexOf('dm') >= 0) {
            if (coordinateminutes < 10) {
                coordinateminutes = '0' + coordinateminutes;
            }
            str += coordinateminutes + "'";

            if (dmsOption.indexOf('dms') >= 0) {
                if (coordinateseconds < 10) {
                    coordinateseconds = '0' + coordinateseconds;
                }
                str += coordinateseconds + '"';
            }
        }

        if (axis == 'lon') {
            str += coordinate < 0 ? OpenLayers.i18n('W') : OpenLayers.i18n('E');
        } else {
            str += coordinate < 0 ? OpenLayers.i18n('S') : OpenLayers.i18n('N');
        }
        return str;
    },

    /** private: method[initPortal]
     * Create the various parts that compose the layout.
     */
    initPortal: function() {

        var westPanel = new gxp.CrumbPanel({
            id: 'tree',
            region: 'west',
            width: 190,
            split: true,
            collapsible: true,
            collapseMode: 'mini',
            hideCollapseTool: true,
            header: false,
            baseCls: 'sidebar-left',
            listeners: {
                collapse: function() {
                    // We need to add the tooltip for the expand button here as the button is not created until collapse happens
                    Ext.query('#tree-xcollapsed .x-layout-mini')[0].title = 'Mostrar árbol de capas';
                },
                scope: this
            }
        });
        var southPanel = new Ext.Panel({
            region: 'south',
            id: 'south',
            height: 220,
            border: false,
            split: true,
            collapsible: true,
            collapseMode: 'mini',
            collapsed: true,
            hideCollapseTool: true,
            header: false,
            layout: 'border',
            items: [{
                    region: 'center',
                    id: 'table',
                    title: this.tableText,
                    layout: 'fit'
                }, {
                    region: 'west',
                    width: 320,
                    id: 'query',
                    title: this.queryText,
                    split: true,
                    collapsible: true,
                    collapseMode: 'mini',
                    collapsed: true,
                    hideCollapseTool: true,
                    layout: 'fit'
                }
            ]
        });
        //var toolbar = new Ext.Toolbar({
        //    disabled: true,
        //    id: 'paneltbar',
        //    items: []
        //});
        this.on('ready', function() {
            // enable only those items that were not specifically disabled
            //var disabled = toolbar.items.filterBy(function(item) {
            //    return item.initialConfig && item.initialConfig.disabled;
            //});
            //toolbar.enable();
            //disabled.each(function(item) {
            //    item.disable();
            //});

            // We apply a style to the tools that open toolbars.
            for (var toolName in this.tools) {
                var tool = this.tools[toolName];
                // If the tool doesn't add a toolbar, we do nothing.
                if (tool.toolbar) {
                    var toolButton = tool.actions[0].items[0];
                    toolButton.addClass('vw-icon-toolbar');
                }
            }

            // We handle layer adding after the initial layers are added to the composer.
            // Layers added after this are always removable from the TOC.
            this.mapPanel.map.events.register('addlayer', this, function(event) {
                var layer = event.layer;
                layer.metadata.removable = true;
            });
        });



        this.mapPanelContainer = new Ext.Panel({
            layout: 'card',
            region: 'center',
            defaults: {
                border: false
            },
            items: [
                this.mapPanel
            ],
            activeItem: 0
        });

        var northPanel = this.getNorthPanel();
        var footerPanel = this.getFooterPanel();

        this.portalItems = [{
                region: 'center',
                layout: 'border',
                //tbar: toolbar,
                items: [
                    this.mapPanelContainer,
                    westPanel,
                    southPanel, northPanel]
            }, footerPanel
        ];

        this.addEvents('loginstatechange');

        PersistenceGeo.Composer.superclass.initPortal.apply(this, arguments);

        this.on("ready",this.onPortalReady, this);

    },

    onPortalReady: function(){
        //TODO: Translate this texts
        // We add tooltips to the expander of the feature grid
        Ext.query("#south-xsplit .x-layout-mini")[0].title = "Ocultar tabla de atributos";
        Ext.query("#south-xcollapsed .x-layout-mini")[0].title = "Mostrar tabla de atributos";

        // We add tooltips to the expander of the layers tree       
        Ext.query("#tree-xsplit .x-layout-mini")[0].title = "Ocultar árbol de capas";

        // We add tooltips to the overview map minimize button collaps olControlOverviewMapMaximizeButton olButton
        Ext.query(".olControlOverviewMapMaximizeButton.olButton")[0].title = "Mostrar vista general";
        Ext.query(".olControlOverviewMapMinimizeButton.olButton")[0].title = "Ocultar vista general";
    },

    getNorthPanel: function(){
        return {
            region: 'north',
            id: 'viewer-header',
            cls: 'viewer-header',
            //collapsible: true,
            height: 100,
            layout: 'fit',
            html: '<div id="responsive-wrap">' + '<div id="logo" class="span-4">' + '<a href="' + this.adminUrl + '" title="Inicio" class="logo-chile">' + '<img src="../theme/app/img/logo-gobierno_de_chile.jpg" alt="Logo Gobierno de Chile" height="100" />' + '</a>' + '</div>' + '<img src="../theme/app/img/back-header.jpg" alt="Imagen de fondo de la cabecera" class="banner" />' + '</div><!-- /#responsive-wrap -->'
        };
    },

    getFooterPanel: function(){
        return {
            region: 'south',
            id: 'viewer-footer',
            cls: 'viewer-footer',
            height: 60,
            layout: 'fit',
            html: '<div id="footer">' + '<div class="span-24">' + '<a href="../../contacto/nuevoContacto" target="_blank" style="text-decoration: none;cursor:pointer;">Contacto</a>' + ' | <a href="../../faq/faqs/cartografico" target="_blank" style="text-decoration: none;cursor:pointer;">Preguntas frecuentes</a>' + '</div>' + '<div class="span-24" style="padding-bottom: 30px">' + '<p><strong>Gobierno Regional Región del Libertador General Bernardo O&#39;Higgins</strong></p>' + '</div>' + '</div>'
        };
    },

    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        PersistenceGeo.Composer.superclass.createTools.apply(this, arguments);

        new Ext.Button({
            id: 'loginbutton'
        });

        if (this.authorizedRoles) {
            // unauthorized, show login button
            if (this.authorizedRoles.length === 0) {
                this.showLogin();
            } else {
                var user = this.getCookieValue(this.cookieParamName);
                if (user === null) {
                    user = 'unknown';
                }
                this.showLogout(user);
            }
        }

        new Ext.Button({
            id: 'mapmenu',
            text: this.mapText,
            iconCls: 'icon-map',
            menu: new Ext.menu.Menu({
                items: [{
                        text: this.exportMapText,
                        handler: function() {
                            this.doAuthorized(['ROLE_ADMINISTRATOR'], function() {
                                this.save(this.showEmbedWindow);
                            }, this);
                        },
                        scope: this,
                        iconCls: 'icon-export'
                    }, {
                        text: this.saveMapText,
                        handler: function() {
                            this.doAuthorized(['ROLE_ADMINISTRATOR'], function() {
                                this.save(this.showUrl);
                            }, this);
                        },
                        scope: this,
                        iconCls: 'icon-save'
                    }
                ]
            })
        });

        new Ext.Button({
            id: 'toggleheader',
            iconCls: 'x-tool x-tool-maximize',
            tooltip: 'Click para ocultar la cabecera',
            listeners: {
                click: this._toggleHeader,
                scope: this
            }
        });


    },

    _toggleHeader: function(param) {
        var header = Ext.getCmp('viewer-header');
        var button = Ext.getCmp('toggleheader');

        header.toggleCollapse(true);

        var iconCls = !header.collapsed ? 'x-tool-restore' : 'x-tool-maximize';
        var tooltip = !header.collapsed ? 'Click para mostrar la cabecera' : 'Click para ocultar la cabecera';
        console.log(tooltip);
        button.setTooltip(tooltip);
        button.setIconClass('x-tool ' + iconCls);
    },

    /** private: method[showEmbedWindow]
     */
    showEmbedWindow: function() {
        var toolsArea = new Ext.tree.TreePanel({
            title: this.toolsTitle,
            autoScroll: true,
            root: {
                nodeType: 'async',
                expanded: true,
                children: this.viewerTools
            },
            rootVisible: false,
            id: 'geobuilder-0'
        });

        var previousNext = function(incr) {
            var l = Ext.getCmp('geobuilder-wizard-panel').getLayout();
            var i = l.activeItem.id.split('geobuilder-')[1];
            var next = parseInt(i, 10) + incr;
            l.setActiveItem(next);
            Ext.getCmp('wizard-prev').setDisabled(next === 0);
            Ext.getCmp('wizard-next').setDisabled(next == 1);
            if (incr == 1) {
                this.save();
            }
        };

        var embedMap = new gxp.EmbedMapDialog({
            id: 'geobuilder-1',
            url: '../viewer/#maps/' + this.id
        });

        var wizard = {
            id: 'geobuilder-wizard-panel',
            border: false,
            layout: 'card',
            activeItem: 0,
            defaults: {
                border: false,
                hideMode: 'offsets'
            },
            bbar: [{
                    id: 'preview',
                    text: this.previewText,
                    handler: function() {
                        this.save(this.openPreview.createDelegate(this, [embedMap]));
                    },
                    scope: this
                }, '->', {
                    id: 'wizard-prev',
                    text: this.backText,
                    handler: previousNext.createDelegate(this, [-1]),
                    scope: this,
                    disabled: true
                }, {
                    id: 'wizard-next',
                    text: this.nextText,
                    handler: previousNext.createDelegate(this, [1]),
                    scope: this
                }
            ],
            items: [toolsArea, embedMap]
        };

        new Ext.Window({
            layout: 'fit',
            width: 500,
            height: 300,
            title: this.exportMapText,
            items: [wizard]
        }).show();
    },

    downloadFile: function(url, params, sourceForm) {
        var body = Ext.getBody();
        body.createChild({
            tag: 'iframe',
            cls: 'x-hidden',
            id: 'app-upload-frame',
            name: 'uploadframe'
        });


        var downloadForm;
        if (typeof(sourceForm) == 'undefined') {
            downloadForm = body.createChild({
                tag: 'form',
                cls: 'x-hidden',
                id: 'app-upload-form'
            });
        } else {
            downloadForm = sourceForm;
        }

        Ext.Ajax.request({
            url: url || '.',
            params: params || {},
            form: downloadForm,
            isUpload: true,
            scope: this
        });
    }

});
