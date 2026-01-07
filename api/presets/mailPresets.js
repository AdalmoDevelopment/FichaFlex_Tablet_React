import 'dotenv/config';

function anticiposPreset(params) {
    const preset = `
            <div style="font-family: Arial, sans-serif; text-align: center; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="background-color: #3ED89C; color: white; padding: 10px; border-radius: 5px; margin: 0;">
                Informe de petición de anticipo
            </h2>
            <p style="color: #333; font-size: 16px;">Hola,</p>
            <p style="color:#3ED89C; font-size: 18px; font-weight: bold;">${params.nombre}</p>
            <p style="color: #333; font-size: 16px;">ha pedido un anticipo de <p style="color:#3ED89C; font-size: 20px">${params.amount} €</p>
                mediante la tablet de ${params.delegacion}.
            </p> 
            <div style="flex-direction: row; justify-content: space-around;">
                <a 
                    href="http://${process.env.HOST_BACKEND_ADVANCES}:3001/api/processing-advance/${params.id_registro}/1"
                    style="
                        display:inline-block;
                        padding:12px 32px;
                        margin-right:30px;
                        background-color:#55e27f ;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                        font-size:16px;
                    "
                >
                    Aceptar
                </a>
                <a 
                    href="http://${process.env.HOST_BACKEND_ADVANCES}:3001/api/processing-advance/${params.id_registro}/0"
                    style="
                        display:inline-block;
                        padding:12px 32px;
                        background-color:#b52b2b;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                        font-size:16px;
                    "
                >
                    Denegar
                </a>
            </div>

            <div style="margin-top: 15px; text-align: center; background-color: #3ED89C; border-radius: 5px">
                <img src="cid:fichaflexImage" style="max-width: 120px; height: auto; border-radius: 5px; display: inline-block;" />
            </div>
            <br>
        </div>
        <p style="color: #ffb800; text-align: center">*Sólo se puede aceptar/denegar una vez, contactar con IT en caso de equivocación*</p> 
        `
    return preset
}

export { anticiposPreset };