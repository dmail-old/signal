const fs = require("fs")
const path = require("path")
const { createRoot } = require("@dmail/project-structure")
const { transform, options } = require("@dmail/project-babel")
const { writeFile } = require("./helper.js")

const getFileContentAsString = (location) =>
  new Promise((resolve, reject) => {
    fs.readFile(location, (error, buffer) => {
      if (error) {
        reject(error)
      } else {
        resolve(buffer.toString())
      }
    })
  })

const compileRoot = (root) => {
  return createRoot(root).then(({ forEachFileMatching }) => {
    return forEachFileMatching(
      ({ build }) => build,
      ({ absoluteName, relativeName }) => {
        return getFileContentAsString(absoluteName).then((source) => {
          return transform(source, options, {
            filename: absoluteName,
            sourceMaps: true,
            sourceFileName: relativeName,
          }).then(({ code, map }) => {
            const buildLocation = `${root}/dist/${relativeName}`

            if (map) {
              const sourceMapLocation = `./${path.basename(relativeName)}.map`
              code = `${code}
	//# sourceMappingURL=${sourceMapLocation}`
              return Promise.all([
                writeFile(buildLocation, code),
                writeFile(sourceMapLocation, JSON.stringify(map, null, "  ")),
              ])
            }

            return writeFile(buildLocation, code)
          })
        })
      },
    )
  })
}

const root = path.resolve(__dirname, "../")
compileRoot(root)
