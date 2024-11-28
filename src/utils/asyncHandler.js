const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };

// doint the upper code using try catch method.......

// const asyncHandler = (fn) => async(req,res,next)=>{

//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(err.code || 500).json({
//               success:false,
//               message:error.message
//         })
//     }

// }
