// https://github.com/jsenv/core/blob/959e76068b62c23d7047f6a8c7a3d6582ac25177/src/api/util/uneval.js

// https://github.com/joliss/js-string-escape/blob/master/index.js
// http://javascript.crockford.com/remedial.html
const quote = value => {
	const string = String(value)
	let i = 0
	const j = string.length
	var escapedString = ""
	while (i < j) {
		const char = string[i]
		let escapedChar
		if (char === '"' || char === "'" || char === "\\") {
			escapedChar = `\\${char}`
		} else if (char === "\n") {
			escapedChar = "\\n"
		} else if (char === "\r") {
			escapedChar = "\\r"
		} else if (char === "\u2028") {
			escapedChar = "\\u2028"
		} else if (char === "\u2029") {
			escapedChar = "\\u2029"
		} else {
			escapedChar = char
		}
		escapedString += escapedChar
		i++
	}
	return escapedString
}

const getPrimitiveType = value => {
	if (value === null) {
		return "null"
	}
	if (value === undefined) {
		return "undefined"
	}
	return typeof value
}

const toString = Object.prototype.toString
const getCompositeType = object => {
	const toStringResult = toString.call(object)
	// returns format is '[object ${tagName}]';
	// and we want ${tagName}
	const tagName = toStringResult.slice("[object ".length, -1)
	if (tagName === "Object") {
		const objectConstructorName = object.constructor.name
		if (objectConstructorName !== "Object") {
			return objectConstructorName
		}
	}
	return tagName
}

const hasOwnProperty = Object.prototype.hasOwnProperty
function getPropertyNames(value) {
	const names = []
	for (let name in value) {
		if (hasOwnProperty.call(value, name)) {
			names.push(name)
		}
	}
	return names
}

const primitiveSources = {}
const compositeSources = {}

Object.assign(primitiveSources, {
	boolean: boolean => boolean.toString(),
	function: (fn, { format, skipFunctionBody }) => {
		if (skipFunctionBody) {
			return `function ${fn.name}`
		}
		return format(fn.toString())
	},
	null: () => "null",
	number: number => number.toString(),
	object: (object, { unevalComposite }) => unevalComposite(getCompositeType(object), object),
	string: string => `"${quote(string)}"`,
	symbol: (symbol, { format }) => format("{}"),
	undefined: () => "undefined"
})
const unevalInstance = (instance, { type, uneval, format }) =>
	format(`new ${type}(${uneval(instance.valueOf())})`)
Object.assign(compositeSources, {
	Array: (array, { seen, depth, uneval, format }) => {
		if (seen) {
			if (seen.indexOf(array) > -1) {
				return "[]"
			}
			seen.push(array)
		} else {
			seen = [array]
		}
		depth = depth ? depth + 1 : 1

		let source = ""
		let i = 0
		const j = array.length

		while (i < j) {
			source += uneval(array[i], { seen, depth })
			if (i < j - 1) {
				source += ", "
			}
			i++
		}

		return format(`[${source}]`)
	},
	Boolean: unevalInstance,
	Date: unevalInstance,
	Error: (error, { expose }) => unevalInstance(error.message, expose({ type: error.name })),
	Number: unevalInstance,
	RegExp: regexp => regexp.toString(),
	Object: (object, { seen, depth, uneval, format }) => {
		if (seen) {
			if (seen.indexOf(object) > -1) {
				return "{}"
			}
			seen.push(object)
		} else {
			seen = [object]
		}
		depth = depth ? depth + 1 : 1

		let source = ""
		const propertyNames = getPropertyNames(object)
		let i = 0
		const j = propertyNames.length

		while (i < j) {
			const propertyName = propertyNames[i]
			const propertyNameSource = uneval(propertyName)
			source += `${propertyNameSource}: ${uneval(object[propertyName], { seen, depth })}`
			if (i < j - 1) {
				source += ", "
			}
			i++
		}

		return format(`{${source}}`)
	},
	String: unevalInstance,
	Symbol: (symbol, { unevalPrimitive }) => unevalPrimitive("symbol", symbol),
	// ici faudrais désactiver les parenthèses jusque pour l'object qu'on uneval
	// mais préserver la valeur par défaut pour ceux qui sont nested
	Other: (object, { type, format, unevalComposite }) =>
		format(`new ${type}(${unevalComposite("Object", object)})`)
})

export const uneval = (
	value,
	options = {
		parenthesis: false,
		skipFunctionBody: false
	}
) => {
	const expose = properties => Object.assign({}, options, properties)

	const localUneval = (value, localOptions = {}) => uneval(value, expose(localOptions))

	const format = string => {
		if (options.parenthesis) {
			return `(${string})`
		}
		return string
	}
	const unevalPrimitive = (type, value) => {
		if (type in primitiveSources) {
			return primitiveSources[type](value, expose({ type }))
		}
		throw new Error(`no match for primitive ${value}`)
	}
	const unevalComposite = (type, value) => {
		const handlerType = type in compositeSources ? type : "Other"
		if (handlerType in compositeSources) {
			return compositeSources[handlerType](value, expose({ type }))
		}
		throw new Error(`no match for composite ${value}`)
	}

	Object.assign(options, {
		expose,
		uneval: localUneval,
		format,
		unevalPrimitive,
		unevalComposite
	})

	return unevalPrimitive(getPrimitiveType(value), value)
}
