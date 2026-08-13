




const {register} = require('../config/metrics');


//get metrics 
const getMetrics = async(req, res) =>{
    try{

        res.setHeader('Content-Type', register.contentType);
        const metricsData = await register.metrics();

        res.status(200).send(metricsData)

    }catch(error){
        res.status(500).send('Error gathering metrics')
    }
}


module.exports = { getMetrics }