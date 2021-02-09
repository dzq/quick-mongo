'use strict';
class BaseController {
    constructor(model) {
        this.model = model
    }


    /**
     * 更新数据
     * @param condition
     * @param updateData
     * @returns {Promise<unknown>}
     */
    async updateData(condition,updateData){
        return new Promise(async (resolve, reject) => {
            // 查找更新id是否存在
            let data = await this.model.findOne(condition)
            if( !data )
                reject("未找到更新数据,请检查id是否有误")
            // 更新数据
            let result = await this.model.updateOne(condition,
                {$set:updateData})
            if( result.nModified != 0 )
                resolve(result)
           reject(result)
        })
    }
    /**
     * 添加数据
     * @param data
     * @returns {Promise<unknown>}
     */
    async addData( data ){
        return new Promise(async (resolve, reject) => {
            let model = new this.model(data)
            await model.save( error =>{
                if( error ){
                    let err = error.errors
                    let msg = ""
                    if (err) {
                        for (let key in err) {
                            msg += err[key].message + ", "
                        }
                    }
                    if( msg != "") msg = msg.slice(0,msg.length-2)
                    reject(msg)
                }
                resolve(model)
            })
        })
    }

    /**
     * 删除数据,成功则返回删除的数据,不成功则返回查找条件
     * @param condition
     * @returns {Promise<unknown>}
     */
    async removeData(condition){
        return new Promise(async (resolve, reject) => {
            // 查找更新id是否存在
            let data = await this.model.findOne(condition)
            if( !data ){
                reject("未找到数据,请检查id是否有误")
                return
            }
            let result = await this.model.findOneAndRemove(condition)
            if( result )
                resolve(result)
            else reject(condition)
        })
    }

    /**
     *  根据id获取数据
     * @param data
     * @param projection
     * @returns {Promise<unknown>}
     */
    async getData(condition, projection){
        return new Promise(async (resolve, reject) => {
            const model = await this.model.findOne(condition,projection||{})
            if(!model ){ // 数据不存在
                reject(condition)
            }
            resolve(model)
        })
    }





    /**
     * 验证必填参数,都符合则返回空字符串
     * @param data
     * @param params
     * @returns {string}
     */
    verifyData(data, params ){
        let r = ""
        if( !params || !params.length || params.length == 0 ) {
            console.log ("params不符合要求")
            return r
        }
        for (let i = 0; i < params.length; i++) {
            let param = params[i]
            if( !data[param] || data[param].toString().trim() == ""){
                r += param + ","
            }
        }
        if( r.length > 0 ) r = r.slice(0,r.length-1)
        return r
    }
    //#region 分页
    /**
     * 查询分页数据
     * @param node_model 对象
     * @param conditions find条件
     * @param options 分页设置
     * @param res
     * @param parser 数据处理函数
     */
    async getListByPage( node_model, conditions, projection,options) {
        return new Promise(async (resolve, reject) => {
            let total = 0
            await this.getTotal(node_model, conditions, projection).then(async data=>{
                total = data
                return await this.where(node_model, conditions, projection,options)
            }).then( async data =>{
                console.log("t: " + total)
                resolve({data:data,total:total})
            }).catch(err=>{
                reject(err)
            })
        })
    }
    /**
     * 根据条件获取有多少条数据 文档数
     * @param node_model 表名
     * @param conditions 查询条件 {a:1, b:2}
     */
    async getTotal(node_model, conditions,projection) {
        return new Promise(async (resolve, reject) => {
            await node_model.find(conditions,projection)
            .countDocuments({})
            .exec((err, data) =>{
                if (err)  reject(err)
                resolve(data)
            });
        })
    };

    /**
     * 连写查询 查询多条数据
     * @param node_model 表名
     * @param conditions 查询条件 {a:1, b:2}
     * @param options 选项：{fields: "a b c", sort: {time: -1}, limit: 10}
     */
    async where(node_model, conditions,projection, options) {
        return new Promise(async (resolve, reject) => {
            await node_model.find(conditions,projection)
            .select(options.fields || '')
            .sort(options.sort || {})//排序 //按某个字段升序(1)降序(-1)
            .skip(options.skip || 0)//跳过的条数
            .limit(options.limit || {})//查询几条
            .exec((err, data) =>{
                if (err)  reject(err)
                resolve(data)
            });
        })
    };

    //#endregion
    /**
     * 默认查询条件
     * @param data
     * @returns {{id: *}}
     */
    getCondition(data){
        return {id:data.id}
    }


    //#region 覆写函数
    /**
     * 解析数据处理
     * @param req
     * @returns {*}
     */
    parseData(req){
        if( req.body.data)
            return req.body.data
        return req.body
    }

    /**
     * 获取分页数据之后的处理
     * @param list
     */
    async parseList(list){}

    /**
     * 获取单个数据之后的处理
     * @param item
     */
    async parseItem(item){}
    //#endregion
}
module.exports = BaseController