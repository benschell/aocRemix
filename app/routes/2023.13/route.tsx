import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 13;
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
            <Label htmlFor="input-one" value="Input Two:" />
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

  const maps = rawInput.split('\n\n');
  let sum = 0;
  let partTwoSum = 0;

  let startLine = parseInt(inputOne);
  if (isNaN(startLine)) {
    startLine = 0;
  }
  let numLines = parseInt(inputTwo);
  if (isNaN(numLines)) {
    numLines = maps.length;
  }
  const doOutput = (level: number, str: string) => {
    output.push(`${''.padStart(level*4, '... ')}${str}`);
    // console.log(`${''.padStart(level*4, '... ')}${str}`);
  };
  doOutput(0, `Iterating over maps: ${startLine} - ${startLine + numLines}`);

  const findReflection = (cols: number[]) => {
    const find = (toFind: number, after: number) => {
      let next = cols.indexOf(toFind, after);
      while (next % 2 === 0 && next !== -1) {
        // next is even
        next = find(toFind, next+1);
      }
      return next;
    };
    let canBeReflection = false;
    let rightEdge = find(cols[0], 1);
    while (rightEdge !== -1) {
      doOutput(4, `Right Edge: ${rightEdge}`);
      canBeReflection = true;
      for (let colIdx = 1; colIdx < rightEdge / 2; colIdx++) {
        if (cols[colIdx] === cols[rightEdge - colIdx]) {
          doOutput(5, `These also match: ${cols[colIdx]}@${colIdx} and ${cols[rightEdge-colIdx]}@${rightEdge-colIdx}`);
        } else {
          canBeReflection = false;
        }
      }
      if (canBeReflection) {
        // 0-1 = 1
        // 0-3 = 2
        // 0-5 = 3
        const reflectionLocation = (rightEdge+1) / 2;
        doOutput(4, `Found left-edge-based reflection via simpler method, ${rightEdge+1} & ${reflectionLocation}`);
        return reflectionLocation;
      } else {
        doOutput(4, `There is not a left-edge-based reflection from 0 - ${rightEdge}`);
      }

      rightEdge = find(cols[0], rightEdge+1);
    }
    doOutput(4, `There is not a left-edge-based reflection`);

    let leftEdge = find(cols[cols.length-1], 0);
    while (leftEdge !== -1) {
      doOutput(4, `Left Edge: ${leftEdge}, iterating from ${cols.length-2} to ${(cols.length - leftEdge) / 2} inclusive`);
      canBeReflection = true;
      for (let colIdx = 1; colIdx < (cols.length - leftEdge) / 2; colIdx++) {
      // for (let colIdx = cols.length-2; colIdx >= (cols.length - leftEdge) / 2 ; colIdx--) {
        doOutput(5, `Comparing: ${cols[cols.length - 1 - colIdx]}@${cols.length - 1 - colIdx} and ${cols[leftEdge + colIdx]}@${cols.length - leftEdge + colIdx}, cols.length: ${cols.length}`);
        if (cols[cols.length - 1 - colIdx] === cols[leftEdge + colIdx]) {
          doOutput(5, `These also match: ${cols[cols.length - 1 - colIdx]}@${cols.length - 1 - colIdx} and ${cols[leftEdge + colIdx]}@${cols.length - leftEdge + colIdx}, cols.length: ${cols.length}`);
        } else {
          canBeReflection = false;
        }
      }
      if (canBeReflection) {
        const reflectionLocation = leftEdge + (cols.length - leftEdge) / 2;
        doOutput(4, `Found right-edge-based reflection via simpler method, ${(cols.length-leftEdge)/2} & ${reflectionLocation}`);
        return reflectionLocation;
      } else {
        doOutput(4, `There is not a right-edge-based reflection from ${leftEdge} - ${cols.length-1}`);
      }
      leftEdge = find(cols[cols.length-1], leftEdge+1);
    }
    doOutput(4, `There is not a right-edge-based reflection`);
    return -1;
  };

  for (let mapIdx = startLine; mapIdx < startLine + numLines; mapIdx++) {
    // Iterate over each map and figure out the rows/cols
    let rowLength: number = -1,
        colLength: number = -1,
        map: number[][] = [],
        rows: number[] = [],
        colStrings: string[] = [],
        cols: number[] = [];
    const lines = maps[mapIdx].split('\n');
    for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
      if (lines[rowIdx].length === 0) {
        continue;
      }
      map[rowIdx] = [];
      for (let charIdx = 0; charIdx < lines[rowIdx].length; charIdx++) {
        map[rowIdx][charIdx] = lines[rowIdx][charIdx] === '#' ? 1 : 0;
      }
      rowLength = lines[rowIdx].length;
      // output.push(lines[rowIdx]);
      const row = parseInt(lines[rowIdx].replaceAll('.', '0').replaceAll('#', '1'), 2);
      rows.push(row);
      for (let colIdx = 0; colIdx < lines[rowIdx].length; colIdx++) {
        if (!colStrings[colIdx]) {
          colStrings[colIdx] = '';
        }
        colStrings[colIdx] += lines[rowIdx][colIdx];
      }
    }
    // output.push(' ');
    // Now that we have all colStrings, let's parse and put into cols
    for (let colIdx = 0; colIdx < colStrings.length; colIdx++) {
      colLength = colStrings[colIdx].length;
      cols.push(parseInt(colStrings[colIdx].replaceAll('.', '0').replaceAll('#', '1'), 2));
    }

    let hasFoundReflection = false,
        reflectionCoords = '';

    output.push(`Cols:\n${cols.map((col) => (col >>> 0).toString(2).padStart(colLength, '0')).join('\n')}`);
    const verticalReflection = findReflection(cols);
    output.push(`Found verticalReflection: ${verticalReflection}`);
    if (verticalReflection !== -1) {
      sum += verticalReflection;
      hasFoundReflection = true;
      reflectionCoords = 'v' + verticalReflection;
    }

    if (!hasFoundReflection) {
      output.push(`Padding rows to ${rowLength}`);
      output.push(`Rows:\n${rows.map((row) => (row >>> 0).toString(2).padStart(rowLength, '0')).join('\n')}`);
      const horizontalReflection = findReflection(rows);
      output.push(`Found horizontalReflection: ${horizontalReflection}`);
      if (horizontalReflection !== -1) {
        sum += horizontalReflection * 100;
        hasFoundReflection = true;
        reflectionCoords = 'h' + horizontalReflection;
      }
    }



    if (!hasFoundReflection) {
      doOutput(8, `We did not find a reflection for this map! ${mapIdx}`);
    } else {
      // Part 2: figure out a way to correct the error
      doOutput(24, `Starting Part 2:`);

      enum CoordChar {
        HORIZONTAL,
        VERTICAL,
      };
      const rowsAndColsFromMap = () => {
        const rows: number[] = [];
        const cols: number[] = [];
        const colStrings: string[] = [];
        for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
          let rowString = '';
          for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
            if (!colStrings[colIdx]) {
              colStrings[colIdx] = '';
            }
            rowString += map[rowIdx][colIdx] ? '1' : '0';
            colStrings[colIdx] += map[rowIdx][colIdx] ? '1' : '0';
          }
          rows.push(parseInt(rowString, 2));
        }
        // output.push(' ');
        // Now that we have all colStrings, let's parse and put into cols
        for (let colIdx = 0; colIdx < colStrings.length; colIdx++) {
          cols.push(parseInt(colStrings[colIdx].replaceAll('.', '0').replaceAll('#', '1'), 2));
        }
        return {
          rows,
          cols,
        };
      }
      const flipCharAtBitAndTry = (x: number, y: number, coordChar: CoordChar) => {
        console.log(`flipping ${x},${y} vs ${map[0].length},${map.length}`);
        const priorValue = map[y][x];
        output.push(`priorValue: ${priorValue}, newValue: ${priorValue === 1 ? 0 : 1}`);
        map[y][x] = priorValue === 1 ? 0 : 1;
        const { rows, cols } = rowsAndColsFromMap();
        let hasFoundReflection = false,
            newReflectionCoords = '';

        output.push(`P2Cols:\n${cols.map((col) => (col >>> 0).toString(2).padStart(colLength, '0')).join('\n')}`);
        const verticalReflection = findReflection(cols);
        const theseVReflectionCoords = 'v' + verticalReflection;
        output.push(`Found P2verticalReflection: ${verticalReflection} vs. ${reflectionCoords}`);
        if (verticalReflection !== -1 && theseVReflectionCoords !== reflectionCoords) {
          map[y][x] = priorValue;
          partTwoSum += verticalReflection;
          output.push(`Returning true, there is a vertical reflection that doesn't match`);
          return true;
        }
    
        if (!hasFoundReflection) {
          output.push(`P2Padding rows to ${rowLength}`);
          output.push(`P2Rows:\n${rows.map((row) => (row >>> 0).toString(2).padStart(rowLength, '0')).join('\n')}`);
          const horizontalReflection = findReflection(rows);
          const theseHReflectionCoords = 'h' + horizontalReflection;
          output.push(`Found P2horizontalReflection: ${theseHReflectionCoords} vs. ${reflectionCoords}`);
          if (horizontalReflection !== -1 && theseHReflectionCoords !== reflectionCoords) {
            map[y][x] = priorValue;
            partTwoSum += 100 * horizontalReflection;
            output.push(`Returning true, there is a horizontal reflection that doesn't match`);
            return true;
          }
        }

        map[y][x] = priorValue;
        return false;
      };
      // We found the reflection. Let's look for pairs of numbers that could change.
      doOutput(1, `Checking for pairs inside cols: ${cols}`);
      let shouldBreak = false;
      for (let colIdx = 0; colIdx < cols.length; colIdx++) {
        for (let otherColIdx = colIdx + 1; otherColIdx < cols.length; otherColIdx++) {
          const xorAsString = ((cols[colIdx] ^ cols[otherColIdx]) >>> 0).toString(2).padStart(colLength, '0');
          const numOnes = xorAsString.split('').filter((char) => char === '1').length;
          const hasOnlyOneBitDifferent = numOnes === 1;
          if (hasOnlyOneBitDifferent) {
            // Ok, so, lets swap the bit that's different, in the first row and try our logic
            const charIdx = xorAsString.indexOf('1');
            doOutput(1, `Comparing: ${cols[colIdx]} vs. ${cols[otherColIdx]}: ${xorAsString} -> ${hasOnlyOneBitDifferent} @ ${charIdx}`);

            output.push(`Finding reflection in modified cols: \n${cols.map((col) => (col >>> 0).toString(2).padStart(colLength, '0')).join('\n')}`);
            if (
              flipCharAtBitAndTry(colIdx, charIdx, CoordChar.VERTICAL) ||
              flipCharAtBitAndTry(otherColIdx, charIdx, CoordChar.VERTICAL)
            ) {
              shouldBreak = true;
              break;
            }
          }
        }
        if (shouldBreak) {
          break;
        }
      }
      if (!shouldBreak) {
        doOutput(1, `Checking for pairs inside rows: ${rows}`);
        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
          let shouldBreak = false;
          for (let otherRowIdx = rowIdx + 1; otherRowIdx < rows.length; otherRowIdx++) {
            const xorAsString = ((rows[rowIdx] ^ rows[otherRowIdx]) >>> 0).toString(2).padStart(rowLength, '0');
            const numOnes = xorAsString.split('').filter((char) => char === '1').length;
            const hasOnlyOneBitDifferent = numOnes === 1;
            if (hasOnlyOneBitDifferent) {
              // Ok, so, lets swap the bit that's different, in the first row and try our logic
              const charIdx = xorAsString.indexOf('1');
              doOutput(1, `Comparing: ${rows[rowIdx]} vs. ${rows[otherRowIdx]}: ${xorAsString} -> ${hasOnlyOneBitDifferent} @ ${charIdx}`);

              if (
                flipCharAtBitAndTry(charIdx, rowIdx, CoordChar.HORIZONTAL) ||
                flipCharAtBitAndTry(charIdx, otherRowIdx, CoordChar.HORIZONTAL)
              ) {
                shouldBreak = true;
                break;
              }
            }
          }
          if (shouldBreak) {
            break;
          }
        }
      }
    }
  }
  output.unshift(`Part 2 Sum: ${partTwoSum}`);
  output.unshift(`Sum: ${sum}`);
  // Part 1:
  // 35735 is too low
  // 10274 will be too low, so that's not it :(
  // 47339 is too high
  // 35141 will be too low :(
  // 22927 will be too low :(
  // 26139 will be too low :(
  // 35141 will again be too low :(
  // 36041 is right!

  // Part 2:
  // 119600 is too high
  // 21234 is too low

  return json({ ok: true, rawInput, output: output.join('\n') });
}