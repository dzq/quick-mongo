'use strict';
let dayjs = require("dayjs")
const BaseController = require("./basecontroller")
class Controller extends BaseController{

    CODE_OK = 200
    CODE_ERROR = 301
    MSG_OK = "success"
    MSG_ERROR = "failed"

    METHOD_ADD = "add"
    METHOD_UPDATE = "update"
    METHOD_DELETE = "delete"
    METHOD_SEARCH = "search"
    METHOD_GET = "get"

    constructor(model) {
        super(model)
        this.add = this.add.bind(this)
        this.getItem = this.getItem.bind(this)
        this.delete = this.delete.bind(this)
        this.list = this.list.bind(this)
        this.list2 = this.list2.bind(this)
        this.search = this.search.bind(this)
        this.search2 = this.search2.bind(this)
        this.update = this.update.bind(this)
    }


    /**
     *  update
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async update( req, res ){
        let data = this.parseData(req)
        let condition = this.getCondition(data)
        let now = dayjs().valueOf()
        await this.updateData(condition,data.updateData).then(r=>{
            let responseTime = dayjs().valueOf() - now
            this.logAction(req, this.METHOD_UPDATE,this.MSG_OK,data,r,responseTime)
            this.ok(res)
        }).catch( e => {
            this.logAction(req,this.METHOD_UPDATE,this.MSG_ERROR,data,e,responseTime)
            this.error(res,e)
        } )
    }

    /**
     * 多条件模糊查询数据
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    async search(req,res){
        let data = this.parseData(req)
        let conditions = []
        data.conditions = data.conditions || {}
        // 遍历所有搜索字段
        for (let name in data.conditions) {
            let condition = {}
            condition[name] = {$regex:data.conditions[name]}
            conditions.push(condition)
            data.conditions[name] = {$regex:data.conditions[name]}
        }
        if( data.operator == "or")
            data.conditions = { $or: conditions}
        await this.list(req,res)
    }
    /**
     * 多条件模糊查询数据2
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    async search2(req,res){
        let data = this.parseData(req)
        let conditions = []
        data.conditions = data.conditions || {}
        // 遍历所有搜索字段
        for (let name in data.conditions) {
            let condition = {}
            condition[name] = {$regex:data.conditions[name]}
            conditions.push(condition)
            data.conditions[name] = {$regex:data.conditions[name]}
        }
        if( data.operator == "or")
            data.conditions = { $or: conditions}
        await this.list2(req,res)
    }
    /**
     * 分页查询数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async list(req, res ){
        let data = this.parseData(req)
        // //#region 条件判断
        // let v = this.verifyData(data,["pageSize","page"])
        // if( v != "")
        //     return this.error(res,v + "不能为空")
        // //#endregion
        const limit = data.pageSize || 20 ;
        let sort = {createTime:-1};
        if( typeof data.sort == "object")
            sort = data.sort
        const skip = data.page || 1;
        let conditions = data.conditions  || {}
        let projection = data.projection || this.listProjection || {"_id":0,"__v":0}
        // 空条件则删除查询字段
        for (const key in conditions) {
            if( conditions[key] == "")
                delete conditions[key]
        }
        // 查询条件
        // if( data.value!= "") conditions[data.key] = data.value
        let options = {
            sort: sort,//排序
            limit,//pageSize
            skip:(limit*(skip-1))//page
        }
        let now = dayjs().valueOf()
        await this.getListByPage(this.model, conditions, projection,options).then( async r =>{
            let responseTime = dayjs().valueOf() - now
            this.logAction(req, this.METHOD_SEARCH,this.MSG_OK,{data,conditions,options},r,responseTime)
            if( data.conditions ) delete data.conditions
            if( data.operator ) delete data.operator
            data.total = r.total
            data.data = r.data
            this.ok(res,data)
        }).catch( e => this.error(res,e) )
    }
    /**
     * 分页查询数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async list2(req, res ){
        let data = this.parseData(req)
        //#region 条件判断
        // let v = this.verifyData(data,["pageSize","page"])
        // if( v != "")
        //     return this.error(res,v + "不能为空")
        //#endregion
        const limit = data.pageSize || 20 ;
        let sort = {createTime:-1};
        if( typeof data.sort == "object")
            sort = data.sort
        const skip = data.page || 1 ;
        let conditions = data.conditions  || {}
        let projection = data.projection || this.listProjection  || {"_id":0,"__v":0}
        // 空条件则删除查询字段
        for (const key in conditions) {
            if( conditions[key] == "")
                delete conditions[key]
        }
        // 查询条件
        // if( data.value!= "") conditions[data.key] = data.value
        let options = {
            sort: sort,//排序
            limit,//pageSize
            skip:(limit*(skip-1))//page
        }
        let now = dayjs().valueOf()
        await this.getListByPage(this.model, conditions, projection,options).then( async r =>{
            let responseTime = dayjs().valueOf() - now
            await this.parseList(r)
            this.logAction(req, this.METHOD_SEARCH,this.MSG_OK,{data,conditions,options},r,responseTime)
            this.ok(res,r.data,r.total,data.pageSize,data.page)
        }).catch( e => {
            this.logAction(req,this.METHOD_SEARCH,this.MSG_ERROR,data,e)
            this.error(res,e)
        } )
    }
    /**
     *  删除数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async delete( req, res ){
        let data = this.parseData(req)
        let condition = this.getCondition(data)
        let now = dayjs().valueOf()
        await this.removeData(condition).then(r=>{
            let responseTime = dayjs().valueOf() - now
            this.logAction(req, this.METHOD_DELETE,this.MSG_OK,data,r,responseTime)
            this.ok(res,r)
        }).catch( e => {
            this.logAction(req,this.METHOD_DELETE,this.MSG_ERROR,data,e)
            this.error(res,e)
        } )
    }
    /**
     *  getItem
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async getItem( req, res ){
        let data = this.parseData(req)
        let condition = this.getCondition(data)
        let projection = data.projection || this.itemProjection || {}
        let now = dayjs().valueOf()
        await this.getData(condition,projection).then(async  r=>{
            let responseTime = dayjs().valueOf() - now
            await this.parseItem(r)
            this.logAction(req, this.METHOD_GET,this.MSG_OK,data,r,responseTime)
            this.ok(res,r)
        }).catch( e => {
            this.logAction(req,this.METHOD_GET,this.MSG_ERROR,data,e)
            this.error(res,e)
        } )
    }
    /**
     * 添加数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async add( req, res ){
        let data = this.parseData(req)
        let now = dayjs().valueOf()
        await this.addData(data).then(r=>{
            let responseTime = dayjs().valueOf() - now
            this.logAction(req, this.METHOD_ADD,this.MSG_OK,data,r,responseTime)
            this.ok(res,r)
        }).catch( e => {
            this.logAction(req,this.METHOD_ADD,this.MSG_ERROR,data,e)
            this.error(res,e)
        } )
    }

    //#region 封装返回结果
    wrapRes(res,code,msg,data,total,pageSize,page){
        let r = {code:code,msg:msg}
        if( pageSize ) r.pageSize = pageSize;
        if( page ) r.page = page;
        if( total || total == 0) r.total = total;
        if( data ) r.data = data;
        res.send(r)
    }

    /**
     * 成功结果
     * @param res
     * @param data
     */
    ok(res,data,total,pageSize,page){
        this.wrapRes(res,this.CODE_OK,this.MSG_OK,data,total,pageSize,page)
    }

    /**
     * 出错结果
     * @param res
     * @param msg
     */
    error(res,msg){
        this.wrapRes(res,this.CODE_ERROR,msg||this.MSG_ERROR)
    }
    //#endregion
    //#region log
    logAction(req,method,success,data,result,responseTime){

    }
    //#endregion
}

module.exports = Controller
