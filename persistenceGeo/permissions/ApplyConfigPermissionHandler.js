/*
 * ApplyConfigPermissionHandler.js Copyright (C) 2013 This file is part of PersistenceGeo project
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

/** api: (define)
 *  module = PersistenceGeo.permissions
 *  class = ApplyConfigPermissionHandler
 */
Ext.namespace("PersistenceGeo.permissions");

/**
 * Class: PersistenceGeo.permissions.ApplyConfigPermissionHandler
 * 
 * Permission handler
 * 
 */
PersistenceGeo.permissions.ApplyConfigPermissionHandler = Ext.extend(PersistenceGeo.permissions.PermissionHandler,{

    constructor: function(config) {
        Ext.apply(this, config);

        PersistenceGeo.permissions.PermissionHandler.superclass.constructor.apply(this, arguments);
    },

    postHandleExtension: function(){
        this.initBasicTools();
        this.target.applyConfig(this.basicTools);
    },

    clearPermissionsExtension: function(){
        this.basicTools = new Array();
    },

    // init tools before login!!!
    initBasicTools: function() {
        if(!!this.target.tools){
            if (this.basicTools && this.basicTools.length > 0) {
                var tool;
                for (var i=0, len=this.basicTools.length; i<len; i++) {
                    try {
                        var permissionConfig = this.canCreateTool(this.basicTools[i]);
                        if(permissionConfig){
                            tool = Ext.ComponentMgr.createPlugin(
                                this.basicTools[i], this.target.defaultToolType
                            );
                            tool.init(this.target);
                            permissionConfig.scope = tool;
                        }
                    } catch (err) {
                        throw new Error("Could not create tool plugin with ptype: " + this.basicTools[i].ptype);
                    }
                }
            }
        }
    },

    /** private: method[handlePermission]
     *  Handle a permission.
     */
    handlePermission: function(permission, permissionConfig){
        //console.log("AddActions HANDLE permission -->");
        var toolConfig = permissionConfig ? permissionConfig : this.searchPermission(permission);
        if(!!toolConfig){
           this.createBasicTool(toolConfig);
        }
    },

    createBasicTool: function(permissionConfig){
        
        /** TODO: Create new tool config like Composer
         * {
                ptype: "vw_styler",
                id: "styler",
                sameOriginStyling: false,
                outputConfig: {autoScroll: true, width: 480},
                actionTarget: ["layers.contextMenu"],
                outputTarget: null
            }
         * 
         **/
         var toolConfig = permissionConfig.scope.initialConfig ? permissionConfig.scope.initialConfig : null;
         if(!!toolConfig){
            this.basicTools.push(toolConfig);
         }
    }

});
