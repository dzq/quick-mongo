'use strict';
const BaseController = require("./basecontroller")
class Controller extends BaseController{

    CODE_OK = 200
    CODE_ERROR = 301
    MSG_OK = "success"
    MSG_ERROR = "failed"
    
    constructor(model) {
        super(model)
        this.add = this.add.bind(this)
        this.getItem = this.getItem.bind(this)
        this.delete = this.delete.bind(this)
        this.list = this.list.bind(this)
        this.search = this.search.bind(this)
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
        await this.updateData(condition,data.updateData).then(r=>{
            this.ok(res)
        }).catch( e => this.error(res) )
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
     * 分页查询数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async list(req, res ){
        let data = this.parseData(req)
        //#region 条件判断
        let v = this.verifyData(data,["pageSize","page"])
        if( v != "")
            return this.error(res,v + "不能为空")
        //#endregion
        const limit = data.pageSize ;
        const sort = data.sort || "DESC";
        const skip = data.page ;
        let conditions = data.conditions  || {}
        let projection = data.projection || this.projection || {"_id":0,"__v":0}
        // 空条件则删除查询字段
        for (const key in conditions) {
            if( conditions[key] == "")
                delete conditions[key]
        }
        // 查询条件
        // if( data.value!= "") conditions[data.key] = data.value
        let options = {
            sort: {id: sort},//排序
            limit,//pageSize
            skip:(limit*(skip-1))//page
        }

        await this.getListByPage(this.model, conditions, projection,options).then( async r =>{
            if( data.conditions ) delete data.conditions
            if( data.operator ) delete data.operator
            data.total = r.total
            data.data = r.data
            this.ok(res,data)
        }).catch( e => this.error(res,e) )
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
        await this.removeData(condition).then(r=>{
            this.ok(res,r)
        }).catch( e => this.error(res) )
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
        let projection = this.projection || {}
        await this.getData(condition,projection).then(r=>{
            this.ok(res,r)
        }).catch( e => this.error(res) )
    }
    /**
     * 添加数据
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async add( req, res ){
        let data = this.parseData(req)
        await this.addData(data).then(r=>{
            this.ok(res,r)
        }).catch( e => this.error(res,e) )
    }

    //#region 封装返回结果
    wrapRes(res,code,msg,data,total){
        let r = {code:code,msg:msg}
        if( data ) r.data = data;
        if( total ) r.total = total;
        res.send(r)
    }

    /**
     * 成功结果
     * @param res
     * @param data
     */
    ok(res,data,total){
        this.wrapRes(res,this.CODE_OK,this.MSG_OK,data,total)
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
}

module.exports = Controller