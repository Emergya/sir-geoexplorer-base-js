/*
 * PermissionHandler.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 *  module = PersistenceGeo.widgets
 *  class = LoginWindow
 */
Ext.namespace("PersistenceGeo.permissions");

/**
 * Class: PersistenceGeo.permissions.PermissionHandler
 * 
 * Permission handler
 * 
 */
PersistenceGeo.permissions.PermissionHandler = Ext.extend(Ext.util.Observable,{

    constructor: function(config) {
        Ext.apply(this, config);

        this.handlers = [
            new PersistenceGeo.permissions.CssPermissionHandler(config)
        ];

        PersistenceGeo.permissions.PermissionHandler.superclass.constructor.apply(this, arguments);
    },

    postHandleExtension: function(){

    },

    clearPermissionsExtension: function(){

    },

    postHandle: function(){
        for(var toolId in this.permissionsConfig){
            this.handlePermission(this.permissionsConfig[toolId].permission, this.permissionsConfig[toolId]);
        }
        for(var i = 0; i<this.handlers.length; i++){
            this.handlers[i].postHandleExtension();
        }
    },

    clearPermissions: function(){
        this.permissionsConfig = {};
        for(var key in this.target.tools){
            this.manageTool(this.target.tools[key], key);
        }
        for(var i = 0; i<this.handlers.length; i++){
            this.handlers[i].clearPermissionsExtension();
        }
    },

    /** private: method[handlePermissions]
     *  Handle user permissions.
     */
    handlePermissions: function(){
        this.clearPermissions();
        if(!!this.userInfo
            && !!this.userInfo.permissions){
            for(var i = 0; i<this.userInfo.permissions.length; i++){
                this.searchPermission(this.userInfo.permissions[i]);
            }
        }
        this.postHandle();
    },

    /** private: method[handlePermission]
     *  Handle a permission.
     */
    handlePermission: function(permission, permissionConfig){
        for(var i = 0; i<this.handlers.length; i++){
            this.handlers[i].handlePermission(permission, permissionConfig);
        }
    },

    canCreateTool: function(tool){
        return this.searchPermission(null, tool);
    },

    searchPermission: function(permission, tool){
        if(!!permission){
            for(var toolId in this.permissionsConfig){
                if(this.isValidPermission(permission, this.permissionsConfig[toolId].scope)){
                    this.permissionsConfig[toolId].permission = permission;
                    this.permissionsConfig[toolId].scope.permissionConfig = permission;
                    toolConfig = this.permissionsConfig[toolId];
                    return toolConfig;
                }
            }
        }else if (!!tool && !!this.userInfo
                    && !!this.userInfo.permissions){
            for(var i = 0; i<this.userInfo.permissions.length; i++){
                if(this.isValidPermission(this.userInfo.permissions[i], tool)){
                    return this.manageTool(tool, tool.ptype);
                }
            }
        }
        return false;
    },

    isValidPermission: function(permission, tool){
        var valid = false;
        if(tool.ptype == permission.ptype){
            valid = true;
            if(!!permission.config){
                // first time decode
                if(typeof permission.config == "string"){
                    permission.config = Ext.util.JSON.decode(permission.config);
                }
                for(var key in permission.config){
                    if (tool[key] != permission.config[key]){
                        valid = false;
                        break;
                    }
                }
            }
        }
        return valid;
    },

    copyToHandlers: function(){
        for(var i = 0; i<this.handlers.length; i++){
            this.handlers[i].permissionsConfig = this.permissionsConfig;
            this.handlers[i].userInfo = this.userInfo;
            this.handlers[i].target = this.target;
        }
    },

    manageTool: function(tool, key){
        this.permissionsConfig[key] = {
            scope: tool,
            applyFilter: this.applyFilter,
            loginWindow: this
        };
        this.copyToHandlers();
        return this.permissionsConfig[key];
    },

    applyFilter: function (permissionConfig){
        if(!!permissionConfig 
            && !!permissionConfig.scope
            && !!permissionConfig.permission){
            if(!!permissionConfig.permission.filter){
                console.log("TODO: make filter " + permissionConfig.permission.filter);
            }
        }
        return true;
    }

});
