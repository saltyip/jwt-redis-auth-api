/**blog:
  * this file kinda acts like the middleman of middleman kinda 
  * basically all controller functions are wrapped in a layer of this fn 
  * cuz in those function we throw {status: message:} type thing during an error;
  * so when it throws and error technically it should be caught like smth which does a yk next(err) type thing
  * thats what this fn does when error it throws err so it becomes catchascync(fn) => next(err) -> which ends up calling
  *the error function we wrote in app.js so it takes care of that
  *this way is used as i saves us time to type the try catch block in each controller 
 */ 
    
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default catchAsync
