let activeEffect = null;
class Dep{
    constructor(){
        this.subscribers = new Set()
    }
    depend(){
        if(activeEffect){
            this.subscribers.add(activeEffect);
        }
    }
    notify(){
        this.subscribers.forEach(eff => {
            eff();
        })
    }
}
export const effect = (func) => {
    activeEffect = func;
    func && activeEffect();
    activeEffect = null;
}
const targetMap = new WeakMap();

const getDep = (target, key) => {
    let depMap = targetMap.get(target);
    if(!depMap){
        depMap = new Map();
        targetMap.set(target, depMap)
    }
    let dep = depMap.get(key);
    if(!dep){
        dep = new Dep();
        depMap.set(key, dep);
    }
    return dep;
}

export const reactive = (raw) => new Proxy(raw, {
    get(target, key, receiver){
        const dep = getDep(target, key);
        dep.depend();
        return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver){
        const dep = getDep(target, key);
        Reflect.set(target, key, value, receiver)
        dep.notify();
    }
})
