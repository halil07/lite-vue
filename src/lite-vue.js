import {reactive, effect} from "./reactivity"
export function createApp(initialState){
    const ctx = {
        scope: reactive(initialState),
        baseDirs: {text, if: _if, model}
    }
    return {
        mount: function(target){
            const el = document.querySelector(target);
            process(el, ctx);
        }
    }
}
const dirRE = /^(?:v-|:|@)/;
const interpolationRE = /\{\{([^]+?)\}\}/g;
function process(node, ctx){
    const type = node.nodeType;
    if(type === 1){
        const el = node;
        for(const {name, value} of [...el.attributes]){
            if(dirRE.test(name)){
                applyDirective(el, name, value, ctx);
            }
        }
        let child = el.firstChild;
        while(child){
            process(child, ctx);
            child = child.nextSibling;
        }
    }else if(type === 3){
        const data = node.data;
        if(data.includes("{{")){
            const segments = [];
            let lastIndex = 0;
            let match;
            while(match = interpolationRE.exec(data)){
                segments.push(JSON.stringify(data.slice(lastIndex, match.index)), `${match[1]}`);
                lastIndex = match.index + match[0].length;
            };
            if(lastIndex < data.length - 1){
                segments.push(JSON.stringify(data.slice(lastIndex)))
            }
            
            text(node, ctx, segments.join("+"))
        }
    }
}

const _if = (el, {scope}, value) => {
    const parent = el.parentNode;
    const anchor = new Comment('v-if');
    let isAttached = true;
    effect(() => {
        if(evaluate(scope, value)){
            if(!isAttached){
                parent.insertBefore(el, anchor);
                parent.removeChild(anchor);
                isAttached = true;
            }
        }else if(isAttached){
            parent.insertBefore(anchor, el);
            parent.removeChild(el);
            isAttached = false;
        }
    })
}
const model = (el, {scope}, value) => {
    el.addEventListener("input", (e) => {
        evaluate(scope, `${value}='${e.target.value}'`)
    })
    effect(() => {
        el.value = evaluate(scope, value);
    })
}

const text = (el, {scope}, value) => {
    effect(() => {
        el.data = evaluate(scope, value);
        el.innerText = el.data;
    })
}

function evaluate(scope, exp){
    const fn = new Function('$$scope', `with($$scope){return ${exp}}` );
    return fn(scope);
}

const bind = (el, {scope}, exp, arg) => {
    effect(() => {
        const value = evaluate(scope, exp);
        if(arg in el){
            el[arg] = value;
        }else {
            if(value != null){
                el.setAttribute(arg, value)
            }else{
                el.removeAttribute(arg);
            }
        }
    })
}
const on = (el, {scope}, exp, arg) => {
    const handler = evaluate(scope, `($event => {${exp}})`);
    el.addEventListener(arg, handler);
}

function applyDirective(el, raw, value, ctx){
    let dir;
    let arg;
    if(raw[0] === ":"){
        dir =  bind;
        arg = raw.slice(1);
    }else if (raw[0] === "@"){
        dir = on;
        arg = raw.slice(1);
    }else{
        arg = raw.slice(2);
        dir = ctx.baseDirs[arg];
    }
    if(dir){
        dir(el, ctx, value, arg)
        el.removeAttribute(raw)
    }
}
