const simpleParser = require('mailparser').simpleParser;

exports.parser = async (data) => {
  let parsed = await simpleParser(data);

  const headers = [];

  if (parsed.headerLines.length > 0) {
    parsed.headerLines.forEach((header) => {
      if (header.key === 'x-spam-score') {
        headers.push({
          header: "x-spam-score",
          "value": header.line.split('X-Spam-Score: ')[1]
        });
      }
    })
  }

  parsed.attachments = parsed.attachments.filter(file => {
    if (!file.related) return file;
  });

  const formatted = {
    headers: headers,
    subject: parsed.subject,
    date: parsed.date,
    in_reply_to: parsed.inReplyTo,
    reply_to: parsed.reply_to,
    to: parsed.to ? parsed.to.value: [],
    from: parsed.from ? parsed.from.value: [],
    cc: parsed.cc ? parsed.cc.value: [],
    bcc: parsed.bcc ? parsed.bcc.value : [],
    sender: parsed.sender ? parsed.sender.value: [],
    text_body: parsed.text,
    html_body: parsed.html,
    attachments: parsed.attachments,
  }

  return formatted;
}