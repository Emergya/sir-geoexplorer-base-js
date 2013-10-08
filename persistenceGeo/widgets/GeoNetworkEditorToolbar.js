/*
 * Copyright (C) 2001-2011 Food and Agriculture Organization of the
 * United Nations (FAO-UN), United Nations World Food Programme (WFP)
 * and United Nations Environment Programme (UNEP)
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or (at
 * your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA
 * 
 * Contact: Jeroen Ticheler - FAO - Viale delle Terme di Caracalla 2,
 * Rome - Italy. email: geonetwork@osgeo.org
 */
Ext.namespace('GeoNetwork.editor');

/** api: (define) 
 *  module = GeoNetwork.editor
 *  class = EditorToolbar
 *  base_link = `Ext.Toolbar <http://extjs.com/deploy/dev/docs/?class=Ext.Toolbar>`_
 *
 */
/** api: constructor 
 *  .. class:: GeoNetworkEditorToolbar(config)
 *
 *     Create a metadata results tool bar which interact with
 *     :class:`GeoNetwork.MetadataResultsView`
 *
 *
 */
PersistenceGeo.widgets.GeoNetworkEditorToolbar = Ext.extend(GeoNetwork.editor.EditorToolbar, {
    /** api: ptype = pgeo_gneditortoolbar */
    ptype: "pgeo_gneditortoolbar",

    doPublicationText : "Allow publication",
    requestPublicationText: "Request publication",
    rejectPublicationText: "Reject publication",
    validateText: "Validate",

    defaultConfig: {
        isTemplate: false,
        /**
         * Use this property to add the metadata type selector. Usually, not displayed 
         * for sub-template editing or when interface only allows to edit one kind of records.
         */
        hideTypeMenu: true,
        /**
         * Use this property to display or not the minor edit mode.
         */
        hideMinorEdit: false,
        editAttributes: true
    },
    
    /** private: method[initComponent] 
     *  Initializes the toolbar for the metadata editor.
     */
    initComponent: function(){
        Ext.applyIf(this, this.defaultConfig);
    
        var cmp = [];
        if (!this.hideTypeMenu) {
            cmp.push(this.createTypeMenu());
            cmp.push(['-']);
        }

        this.validateAction = new Ext.Action({
            text: this.validateText,
            scope:this.editor,
            handler : function(){
                this.validate();
            }
        });
        
        this.saveAction = new Ext.Action({
            text: OpenLayers.i18n('save'),
            iconCls: 'saveMetadata',
            ctCls: 'gn-bt-main',
            handler: function(){
                this.save();
            },
            scope: this.editor
        });
        
        // Request related buttons.
        this.doPublishAction = new Ext.Action({
            text: this.doPublicationText,
            handler: function(){
                this.doPublication();
            },
            scope: this.editor
        });

        this.requestPublishAction = new Ext.Action({
            text: this.requestPublicationText,
            handler: function(){
                this.publicationRequest();
            },
            scope: this.editor
        });

        this.rejectAction = new Ext.Action({
            text: this.rejectPublicationText,
            handler: function(){
                this.doRejection();
            },
            scope: this.editor
        });

        this.cancelAction = new Ext.Action({
           text: OpenLayers.i18n('cancel'),
            iconCls: 'cancel',
            handler: function(){
                this.cancel();
            },
            scope: this.editor
        });


        // Creates unused actions needed by the users of the class internally, but not for our sir-admin users.
        this._createLegacyActions();


        cmp.push(this.createViewMenu());
        cmp.push(this.validateAction);
       

        if(this.editor 
            && this.editor.controller
            && this.editor.controller.isUpdate){
            cmp.push(this.doPublishAction);
            cmp.push(this.rejectAction);
        }else{
             cmp.push( 
                this.requestPublishAction);
        }
        
        cmp.push(this.cancelAction);

        GeoNetwork.editor.EditorToolbar.superclass.initComponent.call(this);
        
        this.add(cmp);
    },

    _createLegacyActions : function() {
        // Buttons kept so all still works, but that aren't needed.
        var saveAndCloseText = OpenLayers.i18n('saveAndClose');        

         this.saveAndCloseAction = new Ext.Action({
           text: saveAndCloseText,
            iconCls: 'quitMetadata',
            handler: function(){
                this.finish();
            },
            scope: this.editor
        });
        
//        this.minorCheckbox = new Ext.form.Checkbox({
//            checked: false,
//            boxLabel: OpenLayers.i18n('minorEdit'),
//            listeners: {
//                check: function(c, checked){
//                    document.mainForm.minor.value = this.minorEdit = checked;
//                },
//                scope: this
//            }
//        });
        this.minorCheckbox = new Ext.Button({
            enableToggle: true,
            hidden: this.hideMinorEdit,
            text: OpenLayers.i18n('minorEdit'),
           tooltip: OpenLayers.i18n('minorEditTT'),
            listeners: {
                toggle: function(c, pressed){
                    document.mainForm.minor.value = this.minorEdit = pressed;
                },
                scope: this
            }
        });
        
        this.resetAction = new Ext.Action({
            text: OpenLayers.i18n('reset'),
            iconCls: 'refreshMetadata',
            handler: function(){
                this.reset();
                
            },
            scope: this.editor
        });
        
    }



});