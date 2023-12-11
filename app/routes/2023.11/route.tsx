import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 11;
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
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  const lines = rawInput.split('\n');
  type Coord = {
    x: number;
    y: number;
    type: string;
    isGalaxy: boolean;
  }
  type Galaxy = Coord & {
  };
  // First index = y, incrementing from top to bottom
  // Second index = x, incrementing from left to right
  const map: Coord[][] = [];
  const galaxies = [];
  const rowsWithoutGalaxies: number[] = [],
        colsWithoutGalaxies: number[] = [];
  const printMap = () => {
    // Print the header row with cols
    let header = ' ';
    for (let xIdx = 0; xIdx < map[0].length; xIdx++) {
      header += colsWithoutGalaxies.includes(xIdx) ? 'v' : ' ';
    }
    output.push(header, ...map.map((row, rowIdx) => (rowsWithoutGalaxies.includes(rowIdx) ? '>' : ' ') + row.reduce((existingVal, node) => existingVal + node.type, '')));
  };

  output.push(`Starting map is height: ${lines.length} and width: ${lines[0].length}`);

  for (let yIdx = 0; yIdx < lines.length; yIdx++) {
    // Iterate over the line, finding any galaxies
    // If we find no galaxies, go ahead and add a new line after this one and increment yIdx
    const line = lines[yIdx];
    for (let xIdx = 0; xIdx < line.length; xIdx++) {
      const coord: Coord = {
        x: xIdx,
        y: yIdx,
        type: line[xIdx],
        isGalaxy: line[xIdx] === '#',
      };
      if (!map[yIdx]) {
        map[yIdx] = [];
      }
      map[yIdx].push(coord);

      if (coord.isGalaxy) {
        galaxies.push(coord);
      }
    }
  }
  printMap();

  // Part 1 expansion
  // // Iterate over rows to grow vertically
  // for (let yIdx = 0; yIdx < map.length; yIdx++) {
  //   let hasFoundAGalaxy = false;
  //   for (let xIdx = 0; xIdx < map[yIdx].length; xIdx++) {
  //     if (map[yIdx][xIdx].isGalaxy) {
  //       hasFoundAGalaxy = true;
  //       break;
  //     }
  //   }
  //   if (!hasFoundAGalaxy) {
  //     output.push(`Growing map vertically at ${yIdx}`);
  //     const mapArrToAdd = [];
  //     for (let xIdx = 0; xIdx < map[yIdx].length; xIdx++) {
  //       const expansionCoord: Coord = {
  //         x: xIdx,
  //         y: yIdx+1,
  //         type: '.',
  //         isGalaxy: false,
  //       };  
  //       mapArrToAdd.push(expansionCoord);
  //     }
  //     map.splice(yIdx+1, 0, mapArrToAdd);
  //     lines.splice(yIdx, 0, mapArrToAdd.map((coord) => coord.type).join());
  //     yIdx++;
  //   }
  // }

  // // Iterate over cols to grow horizontally
  // for (let xIdx = 0; xIdx < map[0].length; xIdx++) {
  //   let hasFoundAGalaxy = false;
  //   for (let yIdx = 0; yIdx < map.length; yIdx++) {
  //     if (map[yIdx][xIdx].isGalaxy) {

  //       hasFoundAGalaxy = true;
  //       break;
  //     }
  //   }
  //   if (!hasFoundAGalaxy) {
  //     output.push(`Growing map horizontally at ${xIdx}`);
  //     for (let yIdx = 0; yIdx < map.length; yIdx++) {
  //       const expansionCoord: Coord = {
  //         x: xIdx+1,
  //         y: yIdx,
  //         type: '.',
  //         isGalaxy: false,
  //       };
  //       map[yIdx].splice(xIdx, 0, expansionCoord);
  //       lines[yIdx] += '.';
  //     }
  //     xIdx++;
  //   }
  // }

  // Part 2 expansion
  // Iterate over rows to grow vertically
  for (let yIdx = 0; yIdx < map.length; yIdx++) {
    let hasFoundAGalaxy = false;
    for (let xIdx = 0; xIdx < map[yIdx].length; xIdx++) {
      if (map[yIdx][xIdx].isGalaxy) {
        hasFoundAGalaxy = true;
        break;
      }
    }
    if (!hasFoundAGalaxy) {
      output.push(`Row without galaxy: ${yIdx}`);
      rowsWithoutGalaxies.push(yIdx);
    }
  }

  // Iterate over cols to grow horizontally
  for (let xIdx = 0; xIdx < map[0].length; xIdx++) {
    let hasFoundAGalaxy = false;
    for (let yIdx = 0; yIdx < map.length; yIdx++) {
      if (map[yIdx][xIdx].isGalaxy) {
        hasFoundAGalaxy = true;
        break;
      }
    }
    if (!hasFoundAGalaxy) {
      output.push(`Col without galaxy: ${xIdx}`);
      colsWithoutGalaxies.push(xIdx);
    }
  }
  
  // Probably not needed for Part 2 but NBD
  // Reset coords in galaxies
  for (let yIdx = 0; yIdx < map.length; yIdx++) {
    for (let xIdx = 0; xIdx < map[yIdx].length; xIdx++) {
      map[yIdx][xIdx].x = xIdx;
      map[yIdx][xIdx].y = yIdx;
    }
  }
  printMap();

  output.push(`Have expanded map of height: ${map.length} and width: ${map[0].length}`)

  // Solve paths
  // Part 1: 
  // const expansionAmount = 2;
  // Part 2 Tests:
  // const expansionAmount = 10;
  // const expansionAmount = 100;
  // Part 2 actual:
  const expansionAmount = 1000000;
  let sum = 0;
  for (let startingPoint = 0; startingPoint < galaxies.length; startingPoint++) {
    // Solve the pairs of [startingPoint] vs. [startingPoint...length]
    const start = galaxies[startingPoint];
    for (let galaxyNum = startingPoint+1; galaxyNum < galaxies.length; galaxyNum++) {
      const end = galaxies[galaxyNum];
      // e.g.
      // 1,6 to 5,11
      // Expected output is 9
      // end.y - start.y + end.x - start.x

      // Y of end is definitely >= Y of start
      let yDistance = end.y - start.y;
      // But, X of end may be < X of start
      let xDistance = Math.abs(end.x - start.x);

      // For each col that this passes that expands, grow the xDistance by expansionAmount
      for (let xIdx = Math.min(end.x, start.x) + 1; xIdx < Math.max(end.x, start.x); xIdx++) {
        if (colsWithoutGalaxies.includes(xIdx)) {
          output.push(`Growing expansionAmount due to traversing col ${xIdx}`);
          xDistance += expansionAmount - 1;
        }
      }
      // For each row that this passes that expands, grow the yDistance by expansionAmount
      for (let yIdx = start.y + 1; yIdx < end.y; yIdx++) {
        if (rowsWithoutGalaxies.includes(yIdx)) {
          output.push(`Growing expansionAmount due to traversing row ${yIdx}`);
          yDistance += expansionAmount - 1;
        }
      }

      const distance = yDistance + xDistance;
      sum += distance;
      output.push(`Comparing: ${startingPoint+1} (${start.x},${start.y}) to ${galaxyNum+1} (${end.x},${end.y}): ${xDistance} + ${yDistance} = ${distance}`);

    }
  }
  output.unshift(`Sum: ${sum}`);
  // Part 2:
  // 60089655 too low

  return json({ ok: true, rawInput, output: output.join('\n') });
}