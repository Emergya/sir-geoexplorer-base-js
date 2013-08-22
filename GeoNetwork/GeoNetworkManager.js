/*
 * GeoNetworkManager.js Copyright (C) 2013 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */


/**
 * @required  ext-ux/DateTime/DateTime.js
 * @required  OpenLayers/Handler/RegularPolygon.js
 * @required  OpenLayers/LoadingPanel.js
 * @required  OpenLayers/ScaleBar.js
 * @required  OpenLayers/Format/GeoNetworkRecords.js
 * @required  OpenLayers/Format/CSWGetRecords/v2_0_2_GeoNetwork.js
 * @required  GeoNetwork/Settings.js
 * @required  GeoNetwork/Templates.js
 * @required  GeoNetwork/lib/GeoNetwork.js
 */

// Common catalogue var for GN widgets
var catalogue = null;

/**
 * api: method[initGNManager]
 * Initialize GN catalogue with default config. 
 * TODO: Improve this management
 */
function initGNManager(){
    var lang = 'spa';
    var DEFAULT_LANG_CODE = "es";

    // Config for WGS84 based maps
    GeoNetwork.map.PROJECTION = "EPSG:900913";
    GeoNetwork.map.EXTENT = app.mapPanel.map.maxExtent;

    GeoNetwork.map.BACKGROUND_LAYERS = [app.mapPanel.map.baseLayer];

    GeoNetwork.map.MAP_OPTIONS = {
        projection: GeoNetwork.map.PROJECTION,
        maxExtent: GeoNetwork.map.EXTENT,
        restrictedExtent: GeoNetwork.map.EXTENT,
        controls: []
    };

    // Translations
    initGNTranslations(DEFAULT_LANG_CODE);

    // Editor function
    function edit(metadataId, create, group, child) {

        Ext.getCmp('metadata-panel') && Ext.getCmp('metadata-panel').destroy();
        var editorPanel = new GeoNetwork.editor.EditorPanel({
            defaultViewMode : GeoNetwork.Settings.editor.defaultViewMode,
            catalogue : catalogue,
            selectionPanelImgPath: GN_URL + '/apps/js/ext-ux/images',
            layout : 'border',
            xlinkOptions : {
                CONTACT : true
            }
        });
        var editorWindow = new Ext.Window({
            title: "Metadata editor", items:[editorPanel],
            closeAction: 'hide',
            width: 800,
            height: 600
        });
        editorWindow.show();
        editorPanel.init(metadataId, create, group, child);
        editorPanel.doLayout(false);
    }

    // Show metadata function
    function show(uuid, record, url, maximized, width, height, clean) {

        Ext.get("metadata-info").update("");

        var button_width = 101;
        var button_height = 38;
        var aResTab = new GeoNetwork.view.ViewPanel({
            serviceUrl : catalogue.services.mdView + '?uuid=' + uuid,
            lang : catalogue.lang,
            id : 'metadata-panel',
            renderTo : 'metadata-info',
            autoScroll : true,
            resultsView : catalogue.resultsView,
            layout : 'fit',
            // autoHeight:true,
            padding : '5px 25px',
            currTab : GeoNetwork.defaultViewMode || 'simple',
            printDefaultForTabs : GeoNetwork.printDefaultForTabs || false,
            printUrl : '../../apps/html5ui/print.html',
            catalogue : catalogue,
            // maximized: true,
            metadataUuid : uuid,
            record : record,
            buttonWidth : button_width,
            buttonHeight : button_height
        });

        // aResTab.on("afterrender", function() {
        // // Initialize map and links
        // loadMetadataMap({
        // record : record,
        // title : record.get('title')
        // });
        // });

        showMetadata();
        app.breadcrumb.setDefaultPrevious(2);
        app.breadcrumb.setCurrent({
            text : record.get('title'),
            func : "app.searchApp.addMetadata('" + uuid + "', true)"
        });

        // Get title, keywords and author for current record
        // in order to populate the META tag in the HEAD of the HTML page.
        var contacts = [];
        Ext.each(record.get('contact'), function(item) {
            contacts.push(item.name);
        });
        var subjects = [];
        Ext.each(record.get('subject'), function(item) {
            subjects.push(item.value);
        });
        GeoNetwork.Util.updateHeadInfo({
            title : catalogue.getInfo().name
                    + ' | '
                    + record.get('title')
                    + (record.get('type') ? ' (' + record.get('type') + ')'
                            : ''),
            meta : {
                subject : record.get('abstract'),
                keywords : subjects,
                author : contacts
            }
        });

        token = "|" + uuid;

        if (!GeoNetwork.state.History.getToken()
                || GeoNetwork.state.History.getToken().indexOf("edit=") != 0) {
            if (!Ext.state.Manager.getProvider().restoring) {
                GeoNetwork.state.History.eventsSuspended = true;
                GeoNetwork.state.History.suspendEvents();
                GeoNetwork.state.History.add(token);
                GeoNetwork.state.History.resumeEvents();
                GeoNetwork.state.History.eventsSuspended = false;
            }
        }

        Ext.state.Manager.getProvider().restoring = false;

        hide("share-capabilities");
        hide("permalink-div");

        // Adding social capabilities
        Ext.getCmp("metadata-panel").getTopToolbar().addButton({
            id : 'share-button',
            width : button_width,
            height : button_height,
            handler : function() {
                toggle("share-capabilities");
            },
            text : '',
            tooltip : 'Share this',
            type : 'submit',
            tooltip : OpenLayers.i18n('Social Share'),
            enableToggle : true
        });

        GeoNetwork.Util.removeMetaTags({
            'og:title' : true,
            'og:url' : true
        });

        GeoNetwork.Util.addMetaTag("og:title", record.get('title'));
        GeoNetwork.Util.addMetaTag("og:url", Ext.state.Manager.getProvider()
                .getPrettyLink());

        // Updating social
        Ext.get("custom-tweet-button").dom.href = "https://twitter.com/share?text="
                + record.get('title')
                + " "
                + Ext.state.Manager.getProvider().getPrettyLink();
        Ext.get("custom-tweet-button").dom.title = "Tweet this";

        var fb_url = "https://www.facebook.com/dialog/feed?app_id=307560442683468&redirect_uri="
                + Ext.state.Manager.getProvider().getPrettyLink()
                + '&link='
                + Ext.state.Manager.getProvider().getPrettyLink();

        Ext.get("fb-button")
                .update(
                        '<a href="' + fb_url + '">' + OpenLayers.i18n('Like!')
                                + '</a>');
        Ext.get("fb-button").dom.title = "Like this";
        // feedback window
    //        var feedbackWindow;
    //        var newFeedbackWindow = function() {
    //            feedbackWindow = new GeoNetwork.FeedbackForm(null, record);
    //            feedbackWindow.show();
    //        };
    //        
        // feedback button to open window
    //        Ext.getCmp("metadata-panel").getTopToolbar().addButton({
    //            id : 'feedback-button',
    //            width : button_width,
    //            height : button_height,
    //            tooltip : 'Feedback',
    //            handler : newFeedbackWindow,
    //            text : '',
    //            tooltip : OpenLayers.i18n('Feedback'),
    //            type : 'submit'
    //        });

        // Adding permalink
        Ext.getCmp("metadata-panel").getTopToolbar().addButton({
            id : 'permalink-button',
            width : button_width,
            height : button_height,
            handler : function() {
                var url = Ext.state.Manager.getProvider().getPrettyLink();
                Ext.get("permalink-div").update(url);
                toggle("permalink-div");
            },
            text : '',
            tooltip : OpenLayers.i18n('Permalink'),
            enableToggle : true,
            type : 'submit'
        });

        Ext.getCmp("metadata-panel").doLayout();
        // Add to recent viewed
        addToRecentViewed(record);

    }

    catalogue = new GeoNetwork.Catalogue(
                        {
                            // statusBarId: 'info',
                            lang : lang,
                            LANG: lang,
                            statusBarId : 'info',
                            hostUrl : GN_URL,
                            mdOverlayedCmpId : 'resultsPanel',
                            adminAppUrl : GN_URL + '/srv/' + lang + '/admin',
                            // Declare default store to be used for records and
                            // summary
                            metadataStore : GeoNetwork.Settings.mdStore ? new GeoNetwork.Settings.mdStore()
                                    : new GeoNetwork.data.MetadataResultsStore(),
                            metadataCSWStore : GeoNetwork.data
                                    .MetadataCSWResultsStore(),
                            summaryStore : GeoNetwork.data.MetadataSummaryStore(),
                            editMode : 2,
                            serverLogin: true, // managed with proxy
                            metadataEditFn : edit,
                            metadataShowFn : show
                        });

    catalogue.login('admin', 'admin');

     /**
             * Bottom bar
             * 
             * @return
             */
    function createBBar (){

        var previousAction = new Ext.Action({
            id : 'previousBt',
            text : '&lt;&lt;',
            handler : function() {
                var from = catalogue.startRecord - 50;
                if (from > 0) {
                    catalogue.startRecord = from;
                    catalogue.search(
                            'advanced-search-options-content-form',
                            app.searchApp.loadResults, null,
                            catalogue.startRecord, true);
                }
            },
            scope : this
        });

        var nextAction = new Ext.Action({
            id : 'nextBt',
            text : '&gt;&gt;',
            handler : function() {
                catalogue.startRecord += 50;
                catalogue.search('advanced-search-options-content-form',
                        app.searchApp.loadResults, null,
                        catalogue.startRecord, true);
            },
            scope : this
        });

        return new Ext.Toolbar({
            items : [ previousAction, {
                xtype : 'tbtext',
                text : '',
                id : 'info'
            }, nextAction  ]
        });

    };

    

    var metadataResultsView = new GeoNetwork.MetadataResultsView({
        catalogue : catalogue,
        displaySerieMembers : true,
        autoScroll : true,
        autoWidth : false,
        tpl : GeoNetwork.HTML5UI.Templates.FULL,
        templates : {
            SIMPLE : GeoNetwork.HTML5UI.Templates.SIMPLE,
            THUMBNAIL : GeoNetwork.HTML5UI.Templates.THUMBNAIL,
            FULL : GeoNetwork.HTML5UI.Templates.FULL
        },
        featurecolor : GeoNetwork.Settings.results.featurecolor,
        colormap : GeoNetwork.Settings.results.colormap,
        featurecolorCSS : GeoNetwork.Settings.results.featurecolorCSS
    });

    catalogue.resultsView = metadataResultsView;

    // Add results to map
    catalogue.resultsView.addMap(app.mapPanel.map, true);

    var tBar = new GeoNetwork.MetadataResultsToolbar({
        catalogue : catalogue,
        // searchFormCmp : Ext
        //         .getCmp('advanced-search-options-content-form'),
        // sortByCmp : Ext.getCmp('E_sortBy'),
        metadataResultsView : metadataResultsView
    // Permalink provider is broken due to cookie state probably
    // so remove it from the NGR GUI FIXME
    // permalinkProvider : permalinkProvider
    });

    var resultPanel = new Ext.Panel({
        bodyCssClass : 'md-view',
        tbar : tBar,
        items : metadataResultsView
    });

    // var catalogueWindow = new Ext.Window({
    //     title: "GN Catalogue", items:[resultPanel],
    //     closeAction: 'hide',
    //     width: 800,
    //     height: 600
    // });
    //catalogueWindow.show();
    //return catalogue;
}

/**
 * api: method[initGNTranslations]
 * Add GeoNetwork translations to the 
 * OL internacionalization and make the 
 * lang selected as selected code
 */
function initGNTranslations(lang){

    // Init translation to default language
    var defaultLang = OpenLayers.Lang[lang];
    if(!defaultLang){
       defaultLang = {};
    }
    Ext.applyIf(defaultLang, GeoNetwork.Lang[lang]);
    OpenLayers.Lang[lang] = defaultLang;
    OpenLayers.Lang.setCode(lang);
}