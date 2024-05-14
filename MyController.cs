

using Azure;
using Lucene.Net.Codecs.Compressing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Newtonsoft.Json;
using NPoco.Linq;
using Polly;
using Serilog.Context;
using SyncData.Model;
using SyncData.PublishServer;
using System;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml.Linq;
using Umbraco.Cms.Api.Common.Json;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.ContentEditing;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Persistence.Querying;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Infrastructure.Security;
using Umbraco.Cms.Persistence.EFCore.Scoping;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Common.Security;
using Umbraco.Cms.Web.Common.UmbracoContext;
using Umbraco.Extensions;
using static Azure.Core.HttpHeader;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Model;
using static Umbraco.Cms.Core.Collections.TopoGraph;


namespace ImportSyncData
{
	[PluginController("test")]
	public class MyController : UmbracoApiController
	{
		private IDomainService _domainService;
		private IContentService _contentService;
		private readonly IScopeProvider _scopeprovider;
		private IFileService _fileService;
		private IMediaService _mediaService;
		private IContentTypeService _contentTypeService;
		private readonly IDataTypeService _dataTypeService;
		private ILocalizationService _localizationService;
		private readonly MediaFileManager _mediaFileManager;
		private readonly MediaUrlGeneratorCollection _mediaUrlGeneratorCollection;
		private readonly IShortStringHelper _shortStringHelper;
		private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
		private readonly IConfigurationEditorJsonSerializer _configurationEditorJsonSerializer;
		private readonly PropertyEditorCollection _propertyEditorCollection;
		private IMemberGroupService _memberGroupService;
		private IMemberService _memberService;
		private IMemberTypeService _memberTypeServices;
		private IUserService _userService;
		private readonly IWebHostEnvironment _webHostEnvironment;
		List<string> allFiles = new List<string>();
		private readonly IPublishedContentQuery _publishedContent;
		private IRelationService _relationService;
		private readonly UmbracoHelper _umbracoHelper;
		private IUmbracoHelperAccessor _umbracoHelperAccessor;
		private readonly IPublicAccessService _publicAccessService;
		//IConfiguration configuration;
		//AppSettings AppConfigSettings;
		//public string ServerBaseURL { get; set; }
		private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
		private IMemberManager _memberManager;
		private IHttpClientFactory _httpFactory { get; set; }
		private IHttpContextAccessor _httpContextAccessor;
		private IUmbracoContextFactory _umbracoContextFactory;
		public MyController(IHttpClientFactory httpClientFactory,
			IContentTypeService contentTypeService,
			 IDataTypeService dataTypeService,
				 IDomainService domainService,
			 IContentService contentService,
			  IScopeProvider scopeProvider,
			IFileService fileService,
			IMediaService mediaService,
			ILocalizationService localizationService,
			IConfigurationEditorJsonSerializer configurationEditorJsonSerializer,
			PropertyEditorCollection dataEditors,
			IMemberGroupService memberGroupService,
			IMemberService memberService,
			IMemberTypeService memberTypeService,
			IUserService userService,
			IWebHostEnvironment webHostEnvironment,
			MediaFileManager mediaFileManager,
			MediaUrlGeneratorCollection mediaUrlGenerators,
			IShortStringHelper shortStringHelper,
			IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
			IPublishedContentQuery publishedContentQuery,
			UmbracoHelper umbracoHelper,
			IRelationService relationService,
			IUmbracoHelperAccessor umbracoHelperAccessor,
			IPublicAccessService publicAccessService,
			IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
			IMemberManager memberManager,
			IHttpContextAccessor httpContextAccessor,
			IUmbracoContextFactory umbracoContextFactory
				)
		{
			_umbracoHelper = umbracoHelper;
			_domainService = domainService;
			_contentService = contentService;
			_scopeprovider = scopeProvider;
			_fileService = fileService;
			_mediaService = mediaService;
			_contentTypeService = contentTypeService;
			_dataTypeService = dataTypeService;
			_localizationService = localizationService;
			_configurationEditorJsonSerializer = configurationEditorJsonSerializer;
			_propertyEditorCollection = dataEditors;
			_memberGroupService = memberGroupService;
			_memberService = memberService;
			_memberTypeServices = memberTypeService;
			_userService = userService;
			_relationService = relationService;
			_mediaUrlGeneratorCollection = mediaUrlGenerators;
			_shortStringHelper = shortStringHelper;
			_contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
			_webHostEnvironment = webHostEnvironment;
			_mediaFileManager = mediaFileManager;
			_publishedContent = publishedContentQuery;
			_httpFactory = httpClientFactory;
			_umbracoHelperAccessor = umbracoHelperAccessor;
			_publicAccessService = publicAccessService;
			_backOfficeSecurityAccessor = backOfficeSecurityAccessor;
			_memberManager = memberManager;
			_httpContextAccessor = httpContextAccessor;
			_umbracoContextFactory = umbracoContextFactory;
		}

		[HttpGet]
		public IActionResult testCall()
		{
			string folder = "cSync\\ContentType";
			string[] files = Directory.GetFiles(folder);
			XElement readFile = XElement.Load(files[0]);
			XElement? root = new XElement(readFile.Name, readFile.Attributes());
			string? keyVal = root?.Attribute("Key")?.Value ?? "";
			var contType = _contentTypeService.GetAll().Where(x => x.Key == new Guid(keyVal)).FirstOrDefault();

			if (contType == null) return NotFound();

			var tabDetail = contType.PropertyGroups;
			PropertyGroupCollection? propColl = new PropertyGroupCollection();
			foreach (var tab in tabDetail)
			{
				IEnumerable<XElement>? genericProperties = readFile.Element("GenericProperties").Elements();
				var A = genericProperties.Where(x => x.Element("Tab").Value == tab.Name).Select(x => new Guid(x.Element("Key").Value)).ToList();
				var B = tab.PropertyTypes.Select(x => x.Key).ToList();
				var C = A.Except(B).ToList();
				var D = B.Except(A).ToList();
				if (C.Count != 0)
				{
					foreach (var c in C)
					{
						var genericProperty = genericProperties.Where(x => new Guid(x.Element("Key").Value) == c).FirstOrDefault();
						string? key = genericProperty?.Element("Key")?.Value ?? "";
						string? tabName = genericProperty?.Element("Tab")?.Value ?? "";
						string? nameGp = genericProperty?.Element("Name")?.Value ?? "";
						string? alias = genericProperty?.Element("Alias")?.Value ?? "";
						string? definition = genericProperty?.Element("Definition")?.Value ?? "";
						string? mandatory = genericProperty?.Element("Mandatory")?.Value ?? "";
						string? validation = genericProperty?.Element("Validation")?.Value ?? "";
						string? descriptionGp = genericProperty?.Element("Description")?.Value ?? "";
						string? sortOrder = genericProperty?.Element("SortOrder")?.Value ?? "";
						string? variationsGp = genericProperty?.Element("Variations")?.Value ?? "";
						string? mandatoryMessage = genericProperty?.Element("MandatoryMessage")?.Value ?? "";
						string? validationRegExpMessage = genericProperty?.Element("ValidationRegExpMessage")?.Value ?? "";
						string? labelOnTop = genericProperty?.Element("LabelOnTop")?.Value ?? "";

						IDataType dt = _dataTypeService.GetDataType(new Guid(definition));
						PropertyType newPropType = new PropertyType(_shortStringHelper, dt)
						{
							Key = new Guid(key),
							Name = nameGp,
							Alias = alias,
							Mandatory = Convert.ToBoolean(mandatory),
							Description = descriptionGp,
							SortOrder = Convert.ToInt16(sortOrder),
							Variations = (ContentVariation)Enum.Parse(typeof(ContentVariation), variationsGp),
							MandatoryMessage = mandatoryMessage,
							ValidationRegExpMessage = validationRegExpMessage,
							LabelOnTop = Convert.ToBoolean(labelOnTop),
							ValidationRegExp = validation,
							DataTypeKey = dt.Key
						};
						tab?.PropertyTypes?.Add(newPropType);
					}
					_contentTypeService.Save(contType);
				};//add
				if (D.Count != 0)
				{
					foreach (var cont in D)
					{
						var delType = tab.PropertyTypes.Where(x => x.Key == cont).FirstOrDefault();
						tab?.PropertyTypes.Remove(delType);
						_contentTypeService.Save(contType);
					}

				};//delete
				if (D.Count == 0 && C.Count == 0)
				{
					foreach (var genericProperty in genericProperties)
					{
						string? key = genericProperty?.Element("Key")?.Value ?? "";
						string? tabName = genericProperty?.Element("Tab")?.Value ?? "";
						string? nameGp = genericProperty?.Element("Name")?.Value ?? "";
						string? alias = genericProperty?.Element("Alias")?.Value ?? "";
						string? definition = genericProperty?.Element("Definition")?.Value ?? "";
						string? mandatory = genericProperty?.Element("Mandatory")?.Value ?? "";
						string? validation = genericProperty?.Element("Validation")?.Value ?? "";
						string? descriptionGp = genericProperty?.Element("Description")?.Value ?? "";
						string? sortOrder = genericProperty?.Element("SortOrder")?.Value ?? "";
						string? variationsGp = genericProperty?.Element("Variations")?.Value ?? "";
						string? mandatoryMessage = genericProperty?.Element("MandatoryMessage")?.Value ?? "";
						string? validationRegExpMessage = genericProperty?.Element("ValidationRegExpMessage")?.Value ?? "";
						string? labelOnTop = genericProperty?.Element("LabelOnTop")?.Value ?? "";

						IDataType dt = _dataTypeService.GetDataType(new Guid(definition));
						var updateType = tab.PropertyTypes.Where(x => x.Key == new Guid(key)).FirstOrDefault();
						if (updateType != null)
						{
							updateType.Description = descriptionGp;
							updateType.Key = new Guid(key);
							updateType.Name = nameGp;
							updateType.Alias = alias;
							updateType.Mandatory = Convert.ToBoolean(mandatory);
							updateType.Description = descriptionGp;
							updateType.SortOrder = Convert.ToInt16(sortOrder);
							updateType.Variations = (ContentVariation)Enum.Parse(typeof(ContentVariation), variationsGp);
							updateType.MandatoryMessage = mandatoryMessage;
							updateType.ValidationRegExpMessage = validationRegExpMessage;
							updateType.LabelOnTop = Convert.ToBoolean(labelOnTop);
							updateType.ValidationRegExp = validation;
							if (dt != null)
							{
								updateType.DataTypeKey = dt.Key;
								updateType.DataTypeId = dt.Id;
							}
							_contentTypeService.Save(contType);
						}

					}

				}

			}
			//_contentTypeService.Save(contType);
			return Ok();
		}

		//[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
		//[Route("umbraco/backoffice/test/")]
		//[AllowAnonymous]
		[HttpGet]
		public async Task<IActionResult> testCall2()
		{
			string folder = "cSync\\Content";
			if (!Directory.Exists(folder)) { };
			string[] fyles = Directory.GetFiles(folder);
			string path = "";
			foreach (string file in fyles)
			{
				XElement fileExist = XElement.Load(file);
				XElement? root = new XElement(fileExist.Name, fileExist.Attributes());

				string? keyVal = root.Attribute("Key").Value;
				if (new Guid("a8bdca57-53c9-4e52-aa59-838b62ffeb1e") == new Guid(keyVal))
				{
					path = file; break;
				}
			}
			//string path = "cSync\\Content\\" + node.Name?.Replace(" ", "-").ToLower() + ".config";
			//var elementPath = await _updateContent.ReadNodeAsync(new Guid(id));



			var source = XElement.Load(path);

			
			string jsonData = JsonConvert.SerializeObject(source);
			using (HttpClient client = new HttpClient())
			{
				string url = "http://stage.csync.com/" + "umbraco/publishcontent/publish/UpdateNode";
				HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, url);
				request.Content = new StringContent(jsonData, System.Text.Encoding.UTF8, "application/json");
				
				HttpResponseMessage response = await client.SendAsync(request);

				// Handling response
				if (response.IsSuccessStatusCode)

				{

				}
				return Ok(response);
			}
			//var client = _httpFactory.CreateClient("HttpWeb");
			//JsonSerializerOptions options = new()
			//{
			//	ReferenceHandler = ReferenceHandler.IgnoreCycles,
			//	WriteIndented = true
			//};
			//var json = System.Text.Json.JsonSerializer.Serialize(source, options);
			//var request = new HttpRequestMessage()
			//{
			//	RequestUri = new Uri("http://stage.csync.com/" + "umbraco/publishcontent/publish/UpdateNode"),
			//	Method = HttpMethod.Put
			//};
			//request.Content
			//using var responsemsg = await client.SendAsync(request).ConfigureAwait(false);

			//	return true;
			//else
			//	return false;


			
		}


		//var client = _httpFactory.CreateClient("HttpWeb");
		////var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
		////var request = new HttpRequestMessage()
		////{
		////	RequestUri = new Uri("https://localhost:44303/umbraco/publishcontent/publish/heartbeat?url=http://stage.csync.com/"),
		////	Method = HttpMethod.Get
		////};
		////using var responsemsg = await client.SendAsync(request).ConfigureAwait(false);
		//client.BaseAddress = new Uri("https://stage.csync.com/umbraco/publishcontent/publish/");
		//string response = await client.GetStringAsync("GetNode?id=" + "a8bdca57-53c9-4e52-aa59-838b62ffeb1e").ConfigureAwait(false);
		////_umbracoHelperAccessor.


	}
	public class ImageProc
	{
		public string Key { get; set; }
		public string MediaKey { get; set; }

	}
	public class MediaNameKey
	{
		public Guid Key { get; set; }
		public int Level { get; set; }
		public int SortOrder { get; set; }
		public Guid Parent { get; set; }
		public string Src { get; set; }
		public string Name { get; set; }
		public string Path { get; set; }
		public string ContentType { get; set; }
		public Guid NodeID { get; set; }
	}
}
/**
 * try
			{
				var pathSpl = path.Split("\\");
				String srcpath = Path.Combine(this._webHostEnvironment.WebRootPath, pathSpl[0], pathSpl[1]);
				//Check if directory exist
				if (!Directory.Exists(srcpath))
				{
					Directory.CreateDirectory(srcpath); //Create directory if it doesn't exist
				}
				string imageName = ImgName + ".jpg";
				//set the image path
				string imgPath = Path.Combine(srcpath, pathSpl[2]);

				byte[] imageBytes = Convert.FromBase64String(ImgStr);
				System.IO.File.WriteAllBytes(imgPath, imageBytes);
				return true;
			}
			catch (Exception ex)
			{
				//_logger.LogError("Save Image to folder Exception with {ex}", ex);
				return false;
			}
 * var mediaPath = _webHostEnvironment.MapPathWebRoot("~/media");
			var _media = _mediaService.GetRootMedia().Where(x => x.Name == imageSrc.Name).FirstOrDefault();

			if (_media == null)
			{
				SaveImage(imageSrc.Src, imageSrc.Name, imageSrc.Path.Remove(0,1).Replace("/","\\"));
				try
				{
					string pth = Path.Combine(this._webHostEnvironment.WebRootPath, imageSrc.Path.Remove(0, 1).Replace("/", "\\"));
					using (Stream stream = System.IO.File.OpenRead(pth))
					{
						var parentMedia = _mediaService.GetRootMedia().Where(x => x.Key == imageSrc.Parent).FirstOrDefault();
						int parent = -1;
						if(parentMedia != null) {
							parent = parentMedia.Id;
						}
						
						IMedia media = _mediaService.CreateMedia(imageSrc.Name + ".jpg", parent, imageSrc.ContentType);
						media.SetValue(Constants.Conventions.Media.File, imageSrc.Path);
						media.Key = imageSrc.Key;
						media.Level = Convert.ToInt32(imageSrc.Level);
						media.SortOrder = Convert.ToInt32(imageSrc.SortOrder);
						var result = _mediaService.Save(media);
					}
				}
				catch (Exception ex)
				{
					//_logger.LogError("Image Update Error with exception {ex}", ex);
				}
			}
			else
			{
				//var content = _publishedContent.Content(id);

				//MediaWithCrops? tr = content.Value("image") as MediaWithCrops;

				//if (tr?.Name == imageSrc.Name)
				//{
				//return;
				//}
				IMedia? media = _mediaService.GetById(_media.Id);
				//var parent = _contentService.GetById(id);
				//if (parent != null)
				//{
				//	parent?.SetValue("Image", media.GetUdi().ToString());
				//}
				//_contentService.SaveAndPublish(parent);
			}
 * var diffObj = new JsonDiffPatch();

			var allPubUnPubContent = new List<IContent>();
			var rootNodes = _contentService.GetRootContent();

			var query = new Query<IContent>(_scopeprovider.SqlContext).Where(x => x.Published || x.Trashed);

			foreach (var c in rootNodes)
			{
				allPubUnPubContent.Add(c);
				var descendants = _contentService.GetPagedDescendants(c.Id, 0, int.MaxValue, out long totalNodes, query);
				allPubUnPubContent.AddRange(descendants);
			}

			foreach (var c in allPubUnPubContent)
			{
				List<IContent>? currnt = _contentService.GetVersions(c.Id).ToList();
				
				var titleProp0= currnt.Where(x=> x.Properties.All(x=>x.Id != 0));
				//var titleProp1 = currnt[1].Properties.Where(x => x.Alias == ("title")).FirstOrDefault();
				var a = JsonConvert.SerializeObject(currnt[0].Properties[1].Values.FirstOrDefault());
				//var b = JsonConvert.SerializeObject(currnt[2].Properties[1].Values.FirstOrDefault());

				//var dsd = diffObj.Diff(a, b);

			}
 * 
 * 
 * string folder = "Sync\\Datatypes";
			string[] files = Directory.GetFiles(folder);
			var allDataType = _dataTypeService.GetAll();

			foreach (string file in files)
			{
				XElement readFile = XElement.Load(file); // XElement.Parse(stringWithXmlGoesHere)
				XElement? root = new XElement(readFile.Name, readFile.Attributes());


				string? keyVal = root.Attribute("Key").Value ?? "";
				string? nameVal = readFile.Element("Info").Element("Name").Value ?? "";
				string? editorAlias = readFile.Element("Info").Element("EditorAlias").Value ?? "";
				string? databaseType = readFile.Element("Info").Element("DatabaseType").Value ?? "";
				string? configVal = readFile.Element("Config").Value ?? "";
				
var existDataType = allDataType.Where(x => x.Key == new Guid(keyVal)).FirstOrDefault();
IDataEditor? dataTypeName = _propertyEditorCollection.Where(x => x.Alias == editorAlias).FirstOrDefault();


if (existDataType == null)
{
	existDataType = new DataType(dataTypeName, _configurationEditorJsonSerializer, -1) { Id = existDataType != null ? existDataType.Id : 0 };
	existDataType.Key = new Guid(keyVal);
	existDataType.Name = nameVal;
	string? configSer = _configurationEditorJsonSerializer.Serialize(dataTypeName.Name);
	existDataType.DatabaseType = (ValueStorageType)Enum.Parse(typeof(ValueStorageType), databaseType);
}
else if (existDataType.Name != nameVal)
{
	existDataType.Name = nameVal;
}
if (existDataType.EditorAlias == "Umbraco.ContentPicker")
{
	var config = JsonConvert.DeserializeObject<ContentPickerConfiguration>(configVal);
	if (config != null)
	{
		ContentPickerConfiguration prevalues = (ContentPickerConfiguration)existDataType.Configuration;
		prevalues.IgnoreUserStartNodes = config.IgnoreUserStartNodes;
		prevalues.ShowOpenButton = config.ShowOpenButton;
		prevalues.StartNodeId = config.StartNodeId;
	}
}
else if (existDataType.EditorAlias == "Umbraco.DateTime")
{
	var config = JsonConvert.DeserializeObject<DateTimeConfiguration>(configVal);
	if (config != null)
	{
		DateTimeConfiguration prevalues = (DateTimeConfiguration)existDataType.Configuration;
		prevalues.Format = config.Format;
		prevalues.OffsetTime = config.OffsetTime;
	}
}
else if (existDataType.EditorAlias == "Umbraco.ColorPicker")
{
	var config = JsonConvert.DeserializeObject<ColorPickerConfiguration>(configVal);
	if (config != null)
	{
		ColorPickerConfiguration prevalues = (ColorPickerConfiguration)existDataType.Configuration;
		prevalues.Items = config.Items;
		prevalues.UseLabel = config.UseLabel;
	}
}
else if (existDataType.EditorAlias == "Umbraco.CheckBoxList")
{
	var config = JsonConvert.DeserializeObject<ValueListConfiguration>(configVal);
	if (config != null)
	{
		ValueListConfiguration? prevalues = (ValueListConfiguration)existDataType.Configuration;
		prevalues.Items = config.Items;
	}
}
else if (existDataType.EditorAlias == "Umbraco.DropDown.Flexible")
{
	var config = JsonConvert.DeserializeObject<DropDownFlexibleConfiguration>(configVal);
	if (config != null)
	{
		DropDownFlexibleConfiguration prevalues = (DropDownFlexibleConfiguration)existDataType.Configuration;
		prevalues.Items = config.Items;
		prevalues.Multiple = config.Multiple;
	}
}
else if (existDataType.EditorAlias == "Umbraco.ImageCropper")
{
	var config = JsonConvert.DeserializeObject<ImageCropperConfiguration>(configVal);
	if (config != null)
	{
		ImageCropperConfiguration prevalues = (ImageCropperConfiguration)existDataType.Configuration;
		prevalues.Crops = config.Crops;
	}
}
else if (existDataType.EditorAlias == "Umbraco.MediaPicker3")
{
	var config = JsonConvert.DeserializeObject<MediaPicker3Configuration>(configVal);
	if (config != null)
	{
		MediaPicker3Configuration prevalues = (MediaPicker3Configuration)existDataType.Configuration;
		prevalues.Crops = config.Crops;
		prevalues.EnableLocalFocalPoint = config.EnableLocalFocalPoint;
		prevalues.Filter = config.Filter;
		prevalues.IgnoreUserStartNodes = config.IgnoreUserStartNodes;
		prevalues.Multiple = config.Multiple;
		prevalues.StartNodeId = config.StartNodeId;
		prevalues.ValidationLimit = config.ValidationLimit;
	}
}
else if (existDataType.EditorAlias == "Umbraco.Label")
{
	var config = JsonConvert.DeserializeObject<LabelConfiguration>(configVal);
	if (config != null)
	{
		LabelConfiguration prevalues = (LabelConfiguration)existDataType.Configuration;
		prevalues.ValueType = config.ValueType;
	}
}
else if (existDataType.EditorAlias == "Umbraco.ListView")
{
	var config = JsonConvert.DeserializeObject<ListViewConfiguration>(configVal);
	if (config != null)
	{
		ListViewConfiguration prevalues = (ListViewConfiguration)existDataType.Configuration;
		prevalues.BulkActionPermissions = config.BulkActionPermissions;
		prevalues.Icon = config.Icon;
		prevalues.IncludeProperties = config.IncludeProperties;
		prevalues.Layouts = config.Layouts;
		prevalues.OrderBy = config.OrderBy;
		prevalues.OrderDirection = config.OrderDirection;
		prevalues.PageSize = config.PageSize;
		prevalues.ShowContentFirst = config.ShowContentFirst;
		prevalues.TabName = config.TabName;
		prevalues.UseInfiniteEditor = config.UseInfiniteEditor;
	}
}
else if (existDataType.EditorAlias == "Umbraco.MemberPicker") //todo
{
	var config = JsonConvert.DeserializeObject(configVal);
	if (config != null)
	{

	}
}
else if (existDataType.EditorAlias == "Umbraco.MultiUrlPicker")
{
	var config = JsonConvert.DeserializeObject<MultiUrlPickerConfiguration>(configVal);
	if (config != null)
	{
		MultiUrlPickerConfiguration prevalues = (MultiUrlPickerConfiguration)existDataType.Configuration;
		prevalues.HideAnchor = config.HideAnchor;
		prevalues.IgnoreUserStartNodes = config.IgnoreUserStartNodes;
		prevalues.MaxNumber = config.MaxNumber;
		prevalues.MinNumber = config.MinNumber;
		prevalues.OverlaySize = config.OverlaySize;
	}

}
else if (existDataType.EditorAlias == "Umbraco.Integer")
{
	var config = JsonConvert.DeserializeObject(configVal);
	if (config != null)
	{

	}
}
else if (existDataType.EditorAlias == "Umbraco.TinyMCE")
{
	var config = JsonConvert.DeserializeObject<RichTextConfiguration>(configVal);
	if (config != null)
	{
		RichTextConfiguration prevalues = (RichTextConfiguration)existDataType.Configuration;
		prevalues.Editor = config.Editor;
		prevalues.HideLabel = config.HideLabel;
		prevalues.IgnoreUserStartNodes = config.IgnoreUserStartNodes;
		prevalues.MediaParentId = config.MediaParentId;
		prevalues.OverlaySize = config.OverlaySize;
	}
}
else if (existDataType.EditorAlias == "Umbraco.Tags")
{
	var config = JsonConvert.DeserializeObject<TagConfiguration>(configVal);
	if (config != null)
	{
		TagConfiguration prevalues = (TagConfiguration)existDataType.Configuration;
		prevalues.Delimiter = config.Delimiter;
		prevalues.Group = config.Group;
		prevalues.StorageType = config.StorageType;
	}
}
else if (existDataType.EditorAlias == "Umbraco.TextBox")
{
	var config = JsonConvert.DeserializeObject<TextboxConfiguration>(configVal);
	if (config != null)
	{
		TextboxConfiguration prevalues = (TextboxConfiguration)existDataType.Configuration;
		prevalues.MaxChars = config.MaxChars;
	}
}
else if (existDataType.EditorAlias == "Umbraco.TextArea")
{
	var config = JsonConvert.DeserializeObject<TextAreaConfiguration>(configVal);
	if (config != null)
	{
		TextAreaConfiguration prevalues = (TextAreaConfiguration)existDataType.Configuration;
		prevalues.MaxChars = config.MaxChars;
		prevalues.Rows = config.Rows;
	}
}
else if (existDataType.EditorAlias == "Umbraco.TrueFalse")
{
	var config = JsonConvert.DeserializeObject<TrueFalseConfiguration>(configVal);
	if (config != null)
	{
		TrueFalseConfiguration prevalues = (TrueFalseConfiguration)existDataType.Configuration;
		prevalues.Default = config.Default;
		prevalues.LabelOff = config.LabelOff;
		prevalues.LabelOn = config.LabelOn;
		prevalues.ShowLabels = config.ShowLabels;
	}
}
else if (existDataType.EditorAlias == "Umbraco.UploadField")
{
	var config = JsonConvert.DeserializeObject<FileUploadConfiguration>(configVal);
	if (config != null)
	{
		FileUploadConfiguration prevalues = (FileUploadConfiguration)existDataType.Configuration;
		prevalues.FileExtensions = config.FileExtensions;
	}
}
else if (existDataType.EditorAlias == "Umbraco.MediaPicker")
{
	var config = JsonConvert.DeserializeObject<MediaPickerConfiguration>(configVal);
	if (config != null)
	{
		MediaPickerConfiguration prevalues = (MediaPickerConfiguration)existDataType.Configuration;
		prevalues.DisableFolderSelect = config.DisableFolderSelect;
		prevalues.IgnoreUserStartNodes = config.IgnoreUserStartNodes;
		prevalues.Multiple = config.Multiple;
		prevalues.OnlyImages = config.OnlyImages;
		prevalues.StartNodeId = config.StartNodeId;
	}
}
else if (existDataType.EditorAlias == "Umbraco.RadioButtonList")
{
	var config = JsonConvert.DeserializeObject<ValueListConfiguration>(configVal);
	if (config != null)
	{
		ValueListConfiguration prevalues = (ValueListConfiguration)existDataType.Configuration;
		prevalues.Items = config.Items;
	}
}
else
{
	if (existDataType.EditorAlias == "sds")
	{

	}
}
_dataTypeService.Save(existDataType);

			}*/