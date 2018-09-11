const rimContext = {}
const indentParse = async (stream, offset = 0)=> {
	const isStart = offset==0
	const {context, offset: o} = !isStart? getLineContext(stream, offset)
		: rimContext
	return await context.indentParse(stream, o)
}
rimContext.indentParse = async (stream, offset = 0)=> {
	const context = this
	const getLine = (stream, offset)=> ({
		line: stream.substr(offset, stream.indexOf('\n', offset)),
		next: ()=> getLine(stream, offset+line.length)
	}}
	const iterate = x=> {
		const a = []
		while (a[a.length] = x.next()) {}
		a.pop()
		return a
	}
	const line = getLine(stream, offset)
	const lines = iterate(line)
	const rawLines = lines.map(rawText=> {
		const indent = rawText.match(/^(\t|  )*/)[0]
		const indentations = indent.replace(/  /g, '\t').length
		return {indentations, rawText}
	})

	const subIndentFixLines = async rawLines=> {
		const parents = []
		return Promise.all(rawLines.map(({indentations, rawText})=> {
			const getLine = level=> ({
				indentations: indentations-level,
				text: rawText.replace(
					new RegExp(`^(\\t|  ){${level}}`), ''
				),
				rawLines: [],
			})
			
			const toRemove = parents.length-indentations
			if (toRemove) parents.splice(parents.length-toRemove, toRemove)
			
			const parent = !parents.length? null: parents[parents.length-1]
			const line = getLine(!parent? 0: parent.indentations)

			if (parent) parent.rawLines.push(line)
			parents.push(line.text)
		}))
	}

	return await context.indentParse(stream, isStart)
}