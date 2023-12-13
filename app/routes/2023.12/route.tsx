import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 12;
const dayStr = `${dayNum}`.padStart(2, '0');
const slug = `2023.${dayStr}`;
const name = `Day ${dayStr}`;

export async function loader({}: LoaderFunctionArgs) {
  const __dirname = getDirname();
  const inputs = await fs.readdir(`${__dirname}/../app/routes/${slug}/inputs`);
  return json({
    inputs
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: name},
    { name: "description", content: name },
  ];
};

export default function Day00() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() || {output: '', rawInput: ''};
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto">
      <h1>{name} <Link to={`https://adventofcode.com/2023/day/${dayNum}`} className="text-lg text-blue-600 hover:underline">Puzzle</Link></h1>

      <h2>Input:</h2>
      <Form method="post" className="flex max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="selected-input" value="Available File Inputs:" />
          </div>
          <Select name="selected-input">
            {data.inputs.map((input, index) => (
              <option key={`option-${index}`}>{input}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="raw-input" value="Raw Text Input:" />
          </div>
          <Textarea className="font-mono" name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="input-one" value="Input One:" />
          </div>
          <TextInput className="font-mono" name="input-one" placeholder="(optionally) provide 'inputOne' here" />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="input-two" value="Input Two:" />
          </div>
          <TextInput className="font-mono" name="input-two" placeholder="(optionally) provide 'inputTwo' here" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea className="font-mono" id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea className="font-mono" id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  const inputOne = formData.get('input-one') as string;
  const inputTwo = formData.get('input-two') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  const lines = rawInput.split('\n');
  const workingLines: string[][][] = [];
  const doOutput = (level: number, str: string) => {
    // output.push(`${''.padStart(level*4, '... ')}${str}`);
    // console.log(`${''.padStart(level*4, '... ')}${str}`);
  }
  const placeInString = (line: string, str: string, location: number) => {
    return line.slice(0, location) + str + line.slice(location+str.length);
  }
  const canThisFit = (line: string, location: number, size: number) => {
    let numAcceptableChars = 0;
    for (let idx = location; idx < location+size; idx++) {
      if (line[idx] === '?' || line[idx] === '#') {
        numAcceptableChars++;
      } else {
        // We didn't find at least one, so we might as well stop
        break;
      }
    }
    // doOutput(0, `Can This Fit? ${size} in ${line} @ ${location}: ${numAcceptableChars}`);
    if (numAcceptableChars === size) {
      // doOutput(0, `YES IT CAN!!!!!`);
      return true;
    }
    return false;
  };
  const place = (lineIdx: number, origLine: string, size: number, startingLocation: number, nextSizes: number[], level: number, part: number) => {
    doOutput(level, `==== Placing in ${origLine}, current size ${size}, starting at ${startingLocation}, remaining sizes: ${nextSizes}`);
    let location = startingLocation;
    while (location + size <= origLine.length) {
      // doOutput(level, `Trying ${origLine.substring(location, location+size)} for size ${size}`);
      // doOutput(level, `Before: ${location === 0 ? 'S' : origLine[location-1]}`);
      // doOutput(level, `After: ${location} + ${size} + 1 >= ${origLine.length} :: ${location + size + 1 >= origLine.length ? 'E' : origLine[location+size]}`);
      if (
        canThisFit(origLine, location, size) &&
        ( // Is the char before this segment a '.' or '?' (or the start of the string)
          location === 0 || // Start of the string
          origLine[location-1] === '.' ||
          origLine[location-1] === '?'
        ) &&
        (// Is the char after this a '.' or '?' (or at the end of the string)
          origLine[location+size] === '.' ||
          origLine[location+size] === '?' ||
          location + size >= origLine.length
        )
      ) {
        doOutput(level, `Attempting to place ${size} at position ${location} in ${origLine}`);
        let line = placeInString(origLine, ''.padStart(size, ''+size), location);
        // doOutput(level, `Now line is ${line}`);
        // If the prior char was a ? and we're relying on that, then we need to make it a .
        if (line[location-1] === '?') {
          // doOutput(level, `Changing ? to . before our char`);
          line = placeInString(line, '.', location-1);
        }
        // If the next char was a ? and we're relying on that, then we need to make it a .
        if (line[location+size] === '?') {
          // doOutput(level, `Changing ? to . after our char`);
          line = placeInString(line, '.', location+size);
        }
        const firstHash = line.indexOf('#');
        if (firstHash !== -1 && firstHash < location) {
          // Bail early, dead end (e.g 1.1.333.1.1.333.1.1.333..1..###?.1..### )
          return;
        }
        doOutput(level, `Presuming line is ${line}, recursing using ${nextSizes}`);
        if (nextSizes.length > 0) {
          // doOutput(level, `recursing!`);
          const nextSize = nextSizes[0];
          const sizes = nextSizes.slice(1);
          for (let newStartingLocation = location+size+1; newStartingLocation < line.length; newStartingLocation++) {
            place(lineIdx, line, nextSize, newStartingLocation, sizes, level + 1, part);
          }
        } else {
          // We've placed all possible things! return?
          line = line.replaceAll('?', '.');
          if (
            !line.includes('#') && // An unallocated #
            !workingLines[part][lineIdx].includes(line)
          ) {
            workingLines[part][lineIdx].push(line);
          }
          // doOutput(level, `Found all possible spots for this!`);
          return true;
        }
      } else {
        // No place for this size, dead end
        // doOutput(level, `Cound not find a place for ${size} (just tried ${location})`);
      }

      location++;
    }
  };
  // Debugging
  let startLine = parseInt(inputOne);
  if (isNaN(startLine)) {
    startLine = 0;
  }
  let numLines = parseInt(inputTwo);
  if (isNaN(numLines)) {
    numLines = lines.length;
  }
  output.push(`Iterating over lines: ${startLine} - ${startLine + numLines}`)
  let sum = 0;
  let partTwoSum = 0;
  for (let lineIdx = startLine; lineIdx < lines.length && lineIdx <= startLine + numLines; lineIdx++) {
    if (lines[lineIdx].length === 0) {
      continue;
    }

    // Part 1
    const lineParts = lines[lineIdx].split(' ');
    const line = lineParts[0];
    const sizes = lineParts[1].split(',').map((size) => parseInt(size));

    const startingLocation = Math.min(line.indexOf('?'), line.indexOf('#')) || 0;

    // Generate possible resolved lines!
    if (!workingLines[0]) { workingLines[0] = []; }
    workingLines[0][lineIdx] = [];
    place(lineIdx, line, sizes[0], startingLocation, sizes.slice(1), 0, 0);

    if (!workingLines[1]) { workingLines[1] = []; }
    workingLines[1][lineIdx] = [];
    place(lineIdx, line+'?'+line, sizes[0], startingLocation, sizes.concat(sizes).slice(1), 0, 1);

    // if (!workingLines[2]) { workingLines[2] = []; }
    // workingLines[2][lineIdx] = [];
    // place(lineIdx, line+'?'+line+'?'+line, sizes[0], startingLocation, sizes.concat(sizes).concat(sizes).slice(1), 0, 2);

    // if (!workingLines[3]) { workingLines[3] = []; }
    // workingLines[3][lineIdx] = [];
    // place(lineIdx, line+'?'+line+'?'+line+'?'+line, sizes[0], startingLocation, sizes.concat(sizes).concat(sizes).concat(sizes).slice(1), 0, 3);

    const div = workingLines[1][lineIdx].length / workingLines[0][lineIdx].length;
    const guess = workingLines[0][lineIdx].length * div * div * div * div;
    output.unshift(`==== ==== Div: ${div}; Guess: ${guess}`)
    // For debugging:
    // output.unshift(`${workingLines[2][lineIdx].join('\n')}`);
    // output.unshift(`With ? prepended TWICE!`);
    // output.unshift(`Round 2: ${workingLines[2][lineIdx].length}`);
    output.unshift(`${workingLines[1][lineIdx].join('\n')}`);
    output.unshift(`With ? prepended!`);
    output.unshift(`Round 1: ${workingLines[1][lineIdx].length}`);
    output.unshift(`${workingLines[0][lineIdx].join('\n')}`);
    output.unshift(`${line} ${sizes.join(',')}`);
    output.unshift(`Round 0: ${workingLines[0][lineIdx].length}`);
    output.unshift(`${lines[lineIdx]} (length: ${line.length})`);

    output.push(`Going to next line...\n\n`);

    // Done trying this line
    sum += workingLines[0][lineIdx].length;
    partTwoSum += guess;

    if (numLines > 0 && lineIdx >= startLine + numLines - 1) {
      break;
    }
  }
  console.log(`Num working lines: ${sum}`);
  output.unshift(`Num working lines: ${sum}`);
  console.log(`Part 2?: ${partTwoSum}`);
  output.unshift(`Part 2?: ${partTwoSum}`);

  // 100 = 400ms = 6s
  // 300 = 1360ms = 23s
  // 600 = 3472ms = 58s

  // Part 1:
  // 10045 is too high
  // 8193 was right

  // Part 2:
  // 

  return json({ ok: true, rawInput, output: output.join('\n') });
}