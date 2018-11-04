
const Server =  require("icebreaker-peer/lib/server")
const _ = require("icebreaker")
const RPC = require("./rpc")

module.exports = function(_local, opts){
    if(!_.isPlainObject(opts)) opts = {}

    opts.authenticate = opts.authenticate || function (id, cb) {
        cb(null, true)
    }

    const server = Server(opts)
    const source = _(server,  server.paraMap({
        connection: (e, cb)=>{
          const duplex = RPC(_local, Object.assign({}, opts, { isClient: false }), (err, api) => {
  
            err = err || e.error
            if (err !=null){
              e.type = "connectionError"
              e.error = e.error||err
              cb(e)
              return
            }
  
            if (e && api) e.peer = api
            if (e.peerID == null) {
              e.error='closing the connection peerID is undefined or null '
               return setImmediate(()=>duplex.end(err,()=>{ cb(e) }))
            }
           cb(e)
          })
          
          e.end = (...args)=> duplex.end(...args)
          
          
          _(e,duplex,e)
        }
      }),
      server.map({
        connectionError:function(e){
          e.type="disconnection"
          return e
        }
      })
    );

    return Object.assign(source,server)
}

