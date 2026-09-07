/**
 * 飞书多维表格代理接口
 * 环境变量需要在Cloudflare Pages设置：
 * FEISHU_APP_ID
 * FEISHU_APP_SECRET
 * FEISHU_TABLE_ID
 */
export async function onRequest(context) {
  const {request,env} = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shop_id");

  if(request.method==="GET"){
    //读取商品列表
    const tokenResp = await fetch("https://open.feishu.cn/open‑api/auth/v3/tenant_access_token/internal",{
      method:"POST",
      headers:{"Content‑Type":"application/json"},
      body:JSON.stringify({app_id:env.FEISHU_APP_ID,app_secret:env.FEISHU_APP_SECRET})
    })
    const tk = await tokenResp.json();
    if(!tk.tenant_access_token) return new Response(JSON.stringify({records:[]}),{status:500});

    const filter = `CurrentValue.shop_id == "${shopId}" && CurrentValue.is_on_sale == true`;
    const tableRes = await fetch(`https://open.feishu.cn/open‑api/bitable/v1/tables/${env.FEISHU_TABLE_ID}/records?filter=${encodeURIComponent(filter)}`,{
      headers:{"Authorization":"Bearer "+tk.tenant_access_token}
    })
    const tableData = await tableRes.json();
    return new Response(JSON.stringify(tableData.data||{records:[]}),{headers:{"content‑type":"application/json"}})
  }

  if(request.method==="POST"){
    //新增商品
    const body = await request.json();
    const tokenResp = await fetch("https://open.feishu.cn/open‑api/auth/v3/tenant_access_token/internal",{
      method:"POST",
      headers:{"Content‑Type":"application/json"},
      body:JSON.stringify({app_id:env.FEISHU_APP_ID,app_secret:env.FEISHU_APP_SECRET})
    })
    const tk = await tokenResp.json();
    if(!tk.tenant_access_token) return new Response(JSON.stringify({ok:false,msg:"获取token失败"}),{status:500});

    const postBody = {
      fields:{
        product_id:crypto.randomUUID(),
        shop_id:body.shop_id,
        product_name:body.product_name,
        price:body.price,
        description:body.description,
        wx_pay_qrcode_url:body.wx_pay_qrcode_url,
        is_on_sale:true,
        sort:0
      }
    }
    const addRes = await fetch(`https://open.feishu.cn/open‑api/bitable/v1/tables/${env.FEISHU_TABLE_ID}/records`,{
      method:"POST",
      headers:{"Authorization":"Bearer "+tk.tenant_access_token,"Content‑Type":"application/json"},
      body:JSON.stringify(postBody)
    })
    const addData = await addRes.json();
    return new Response(JSON.stringify({ok:addData.code===0,msg:addData.msg||"ok"}),{headers:{"content‑type":"application/json"}})
  }
  return new Response("method not allowed",{status:405})
}
