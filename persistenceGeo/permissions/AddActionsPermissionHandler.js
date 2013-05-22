/*
 * AddActionsPermissionHandler.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 *  class = AddActionsPermissionHandler
 */
Ext.namespace("PersistenceGeo.permissions");

/**
 * Class: PersistenceGeo.permissions.AddActionsPermissionHandler
 * 
 * Permission handler
 * 
 */
PersistenceGeo.permissions.AddActionsPermissionHandler = Ext.extend(PersistenceGeo.permissions.PermissionHandler,{

    constructor: function(config) {
        Ext.apply(this, config);

        PersistenceGeo.permissions.PermissionHandler.superclass.constructor.apply(this, arguments);
    },

    /** private: method[handlePermission]
     *  Handle a permission.
     */
    handlePermission: function(permission, permissionConfig){
        //console.log("AddActions HANDLE permission -->");
        var toolConfig = permissionConfig ? permissionConfig : this.searchPermission(permission);
        if(!!toolConfig){
           this.changeToolFunctions(toolConfig);
        }
    },

    changeToolFunctions: function(permissionConfig){
        var tool = permissionConfig.scope;
        // tool.setDisabled.createDelegate(key, this);
        // tool.activateOld = tool.activate;
        // tool.activate = this.defaultActivateFunction.createDelegate(tool);
        // tool.addActionsOld = tool.addActions;
        // tool.addActions = this.defaultAddActionsFunction.createDelegate(tool);
        tool.addActionsOld = tool.addActions;
        tool.addActions = this.defaultAddActionsFunction2.createDelegate(tool);
    }

    defaultSetDisabledFunction: function(disabled, keyTool){
        var me = this;
        console.log("disable '" + (keyTool ? keyTool: "lost") + "' ?");
        if(!!keyTool && !!me 
            && !!me.permissionsConfig[keyTool]
            && !!me.permissionsConfig[keyTool].fn){
            if(me.permissionsConfig[keyTool].permission
                && me.applyFilter(me.permissionsConfig[keyTool])){
                me.permissionsConfig[keyTool].fn(disabled);
            }else{
                me.permissionsConfig[keyTool].fn(true);
            }
        }else{
            console.log("WTF");
            console.log(this);
        }
    },

    defaultAddActionsFunction: function(actions){
        var permissionConfig = this.permissionConfig;
        if(!!permissionConfig
            && !!permissionConfig.applyFilter
            && permissionConfig.applyFilter(permissionConfig)){
            permissionConfig.scope.addActionsOld(actions);
        }else{
            console.log("WTF");
            console.log(this);
            this.addActionsOld([]);
        }
    },

    defaultAddActionsFunction2: function(actions){
        this.addActionsOld(actions);
        var permissionConfig = this.permissionConfig;
        if(!!permissionConfig){
            this.handlePermission(permissionConfig);
        }
    },

    defaultActivateFunction: function(activate){
        var permissionConfig = this.permissionConfig;
        if(!!permissionConfig
            && !!permissionConfig.applyFilter
            && permissionConfig.applyFilter(permissionConfig)){
            permissionConfig.scope.activateOld(activate);
        }else{
            console.log("WTF");
            console.log(this);
            this.activateOld(false);
        }
    }

});
